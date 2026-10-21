import type { DocumentationEntity, MethodEntity, ModuleEntity, RequirementEntity, TestEntity } from "@/types/entities";
import type { GraphEdgeData, GraphNodeData, KnowledgeGraphData } from "@/types/graph";

const langs: Record<string, ModuleEntity["language"]> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  py: "Python",
  java: "Java",
  go: "Go",
  rs: "Rust",
};

const allowed = new Set(["md", "mdx", "txt", ...Object.keys(langs)]);
const ext = (p: string) => p.split(".").pop()?.toLowerCase() ?? "";

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(16).toUpperCase();
};

const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

export interface IngestionResult {
  graph: KnowledgeGraphData;
  fileCount: number;
  supportedCount: number;
  skippedCount: number;
  unsupportedFiles: string[];
  skippedOversized: string[];
  emptyFiles: string[];
  duplicateFiles: string[];
  requirementCount: number;
  moduleCount: number;
  methodCount: number;
  testCount: number;
  detectedLanguages: string[];
  warnings: string[];
}

export async function ingestArtifacts(files: FileList | File[]): Promise<IngestionResult> {
  const fileArray = Array.from(files);
  if (!fileArray.length) {
    throw new Error("No files selected for ingestion.");
  }

  const seenPaths = new Set<string>();
  const input: Array<{ file: File; path: string }> = [];
  const duplicateFiles: string[] = [];
  const warnings: string[] = [];

  for (let idx = 0; idx < fileArray.length; idx++) {
    const file = fileArray[idx];
    const rawPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

    if (seenPaths.has(rawPath)) {
      duplicateFiles.push(rawPath);
      warnings.push(`Skipped duplicate file entry: ${rawPath}`);
      continue;
    }
    seenPaths.add(rawPath);
    input.push({ file, path: rawPath });
  }

  const picked: Array<{ file: File; path: string }> = [];
  const unsupportedFiles: string[] = [];
  const skippedOversized: string[] = [];
  const emptyFiles: string[] = [];

  for (const item of input) {
    const e = ext(item.path);
    if (!allowed.has(e)) {
      unsupportedFiles.push(item.path);
      continue;
    }
    if (item.file.size === 0) {
      emptyFiles.push(item.path);
      warnings.push(`Skipped empty file (0 bytes): ${item.path}`);
      continue;
    }
    if (item.file.size > 1024 * 1024) {
      skippedOversized.push(item.path);
      warnings.push(`Skipped oversized file (> 1 MB limit): ${item.path}`);
      continue;
    }
    picked.push(item);
  }

  if (picked.length === 0) {
    return {
      graph: { nodes: [], edges: [] },
      fileCount: fileArray.length,
      supportedCount: 0,
      skippedCount: fileArray.length,
      unsupportedFiles: unsupportedFiles.slice(0, 30),
      skippedOversized,
      emptyFiles,
      duplicateFiles,
      requirementCount: 0,
      moduleCount: 0,
      methodCount: 0,
      testCount: 0,
      detectedLanguages: [],
      warnings: warnings.length > 0 ? warnings : ["No supported, non-empty code or documentation artifacts found among selected files."],
    };
  }

  // Cap at 500 files for client-side browser performance
  const capped = picked.slice(0, 500);
  if (picked.length > 500) {
    warnings.push(`File selection was capped at 500 files for browser sandbox processing (${picked.length - 500} files omitted).`);
  }

  // Read file contents
  const records: Array<{ path: string; text: string }> = [];
  for (const x of capped) {
    try {
      const text = (await x.file.text()).slice(0, 1000000);
      if (text.trim().length === 0) {
        emptyFiles.push(x.path);
        warnings.push(`Skipped file containing only whitespace: ${x.path}`);
        continue;
      }
      records.push({ path: x.path, text });
    } catch (readErr) {
      warnings.push(`Failed to read file ${x.path}: ${readErr instanceof Error ? readErr.message : "Read error"}`);
    }
  }

  const nodes: GraphNodeData[] = [];
  const edges: GraphEdgeData[] = [];
  const ids = new Set<string>();
  const edgeIds = new Set<string>();
  const reqs = new Map<string, RequirementEntity>();
  const methods: Array<{ id: string; name: string }> = [];
  const tests: Array<{ id: string; text: string }> = [];
  const mods: Array<{ id: string; text: string }> = [];
  const detectedLangSet = new Set<string>();

  const add = (n: GraphNodeData) => {
    if (!ids.has(n.id)) {
      ids.add(n.id);
      nodes.push(n);
    }
  };

  const edge = (source: string, target: string, relationship: GraphEdgeData["relationship"]) => {
    const id = `${source}_${relationship}_${target}`;
    if (ids.has(source) && ids.has(target) && !edgeIds.has(id)) {
      edgeIds.add(id);
      // Client-side heuristic confidence is explicitly set to 0.70 rather than claiming verified AST confidence
      edges.push({ id, source, target, relationship, confidence: 0.70 });
    }
  };

  for (const { path, text } of records) {
    const e = ext(path);

    // Markdown / Documentation intake
    if (["md", "mdx", "txt"].includes(e)) {
      const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.split("/").pop() || path;
      const docId = "DOC-" + hash(path);
      const docType: DocumentationEntity["docType"] = /readme/i.test(path)
        ? "README"
        : /adr/i.test(path)
        ? "ADR"
        : /api/i.test(path)
        ? "API_SPEC"
        : "SRS";
      const doc: DocumentationEntity = {
        id: docId,
        name: title,
        type: "documentation",
        docType,
        filePath: path,
        section: title,
      };
      add({
        id: docId,
        label: title,
        type: "documentation",
        subtitle: path,
        filePath: path,
        entity: doc,
      });

      // Extract REQ codes (e.g. REQ-001, REQ-AUTH-01, REQ_SEC_02)
      for (const m of text.matchAll(/\b(REQ[-_ ]?[A-Z]*[-_]?\d+)\s*[:.)-]?\s*([^\r\n]{8,160})/gi)) {
        const code = clean(m[1]).replace(/^REQ-?/, "REQ-");
        let req = reqs.get(code);
        if (!req) {
          const name = m[2].trim().replace(/^[-*#\s]+/, "").slice(0, 90);
          req = {
            id: code,
            reqCode: code,
            name,
            type: "requirement",
            category: /security|auth|password/i.test(name)
              ? "SECURITY"
              : /audit|compliance/i.test(name)
              ? "COMPLIANCE"
              : "FUNCTIONAL",
            priority: "MEDIUM",
            status: "IN_REVIEW",
            sourceDocument: path,
            description: name,
          };
          reqs.set(code, req);
          add({
            id: code,
            label: code + ": " + name,
            type: "requirement",
            subtitle: "Imported requirement",
            entity: req,
          });
        }
        edge(docId, code, "DOCUMENTS");
      }
      continue;
    }

    // Source code intake
    if (!langs[e]) continue;
    detectedLangSet.add(langs[e]);

    const id = "MOD-" + hash(path);
    const name = path.split("/").pop() || path;
    const modEntity: ModuleEntity = {
      id,
      name,
      type: "module",
      filePath: path,
      language: langs[e],
      loc: text.split(/\r?\n/).length,
      imports: [],
    };
    add({
      id,
      label: "Module: " + name,
      type: "module",
      subtitle: path,
      filePath: path,
      entity: modEntity,
      metrics: { loc: modEntity.loc },
    });
    mods.push({ id, text });

    // Test file pattern detection
    if (/(^|[/_.-])(test|spec|tests|__tests__)([/_.-]|$)/i.test(path)) {
      const found = Array.from(text.matchAll(/(?:it|test|def test_)\s*[( ]\s*["']?([^"']{2,100})["']?/g)).slice(0, 100);
      const names = found.length ? found.map((m) => m[1]) : [name];
      for (const testName of names) {
        const testId = "TST-" + hash(path + testName);
        const entity: TestEntity = {
          id: testId,
          name: testName,
          type: "test",
          testType: "UNIT",
          filePath: path,
          testSuite: name,
          framework: e === "py" ? "Pytest" : e === "java" ? "JUnit" : "Jest",
          lastRunStatus: "SKIPPED",
          durationMs: 0,
        };
        add({
          id: testId,
          label: "Test: " + testName,
          type: "test",
          subtitle: path,
          filePath: path,
          entity,
        });
        tests.push({ id: testId, text });
      }
    } else {
      // Function/Method extraction
      const patterns = [
        /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)/g,
        /def\s+([A-Za-z_$][\w$]*)\s*\([^)]*\):/g,
        /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g,
      ];

      for (const pattern of patterns) {
        for (const m of text.matchAll(pattern)) {
          const fn = m[1];
          if (["if", "for", "while", "switch", "catch"].includes(fn)) continue;
          const line = text.slice(0, m.index).split(/\r?\n/).length;
          const fnId = "MTH-" + hash(path + line + fn);
          const entity: MethodEntity = {
            id: fnId,
            name: fn,
            type: "method",
            filePath: path,
            startLine: line,
            endLine: line,
            signature: m[0].slice(0, 80),
            returnType: "unknown",
            parameters: [],
            visibility: "public",
          };
          add({
            id: fnId,
            label: fn + "()",
            type: "method",
            subtitle: path + ":" + line,
            filePath: path,
            entity,
          });
          edge(id, fnId, "CONTAINS");
          methods.push({ id: fnId, name: fn });
        }
      }
    }
  }

  // Cross-entity edge realization
  // 1. Requirement -> Module (REALIZES)
  for (const mod of mods) {
    for (const req of reqs.values()) {
      if (mod.text.includes(req.reqCode)) {
        edge(req.id, mod.id, "REALIZES");
      }
    }
  }

  // 2. Test -> Method (VERIFIES)
  for (const test of tests) {
    for (const method of methods) {
      if (test.text.includes(method.name)) {
        edge(test.id, method.id, "VERIFIES");
      }
    }
  }

  // 3. Test -> Requirement (VERIFIES, direct verification link when test explicitly references REQ code)
  for (const test of tests) {
    for (const req of reqs.values()) {
      if (test.text.includes(req.reqCode)) {
        edge(test.id, req.id, "VERIFIES");
      }
    }
  }

  const processedCount = records.length;
  const skippedCount = fileArray.length - processedCount;

  return {
    graph: { nodes, edges },
    fileCount: fileArray.length,
    supportedCount: processedCount,
    skippedCount,
    unsupportedFiles: unsupportedFiles.slice(0, 30),
    skippedOversized,
    emptyFiles,
    duplicateFiles,
    requirementCount: reqs.size,
    moduleCount: mods.length,
    methodCount: methods.length,
    testCount: tests.length,
    detectedLanguages: Array.from(detectedLangSet),
    warnings,
  };
}
