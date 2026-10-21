import type { KnowledgeGraphData } from "@/types/graph";
import type {
  TraceabilityMatrixRow,
  TraceabilitySummaryStats,
  CoverageStatus,
} from "@/types/traceability";
import type {
  RequirementEntity,
  ModuleEntity,
  MethodEntity,
  TestEntity,
  AnyTraceEntity,
} from "@/types/entities";

export const emptySummary: TraceabilitySummaryStats = {
  totalRequirements: 0,
  fullyCovered: 0,
  partiallyCovered: 0,
  untested: 0,
  coveragePercent: 0,
  totalTestsMapped: 0,
  overallCoveragePercent: 0,
  fullyTraced: 0,
};

export function evaluateRequirementTraceability(
  graph: KnowledgeGraphData
): TraceabilityMatrixRow[] {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return [];
  }

  const reqNodes = graph.nodes.filter((n) => n.type === "requirement");
  if (reqNodes.length === 0) {
    return [];
  }

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  return reqNodes.map((rn) => {
    const reqEntity = (rn.entity || {
      id: rn.id,
      reqCode: rn.id,
      name: rn.label,
      type: "requirement",
      priority: "HIGH",
      status: "APPROVED",
      acceptanceCriteria: [],
    }) as RequirementEntity;

    // 1. Direct VERIFIES edges:
    // Schema requirement: Source is Test (type: "test"), Target is Requirement (rn.id)
    // Must NOT count arbitrary nodes, non-test entities, or reversed directions
    const directTests: TestEntity[] = [];
    const directTestIds = new Set<string>();

    for (const edge of graph.edges) {
      if (edge.relationship === "VERIFIES" && edge.target === rn.id) {
        const candidate = nodeMap.get(edge.source);
        if (candidate && candidate.type === "test") {
          if (!directTestIds.has(candidate.id)) {
            directTestIds.add(candidate.id);
            directTests.push((candidate.entity || {
              id: candidate.id,
              name: candidate.label,
              type: "test",
              testType: "UNIT",
              status: "PASSED",
              framework: "Jest",
            }) as TestEntity);
          }
        }
      }
    }

    // 2. Realizing Modules (Requirement -> Module via REALIZES)
    const realizingModules: ModuleEntity[] = [];
    const moduleIds = new Set<string>();

    for (const edge of graph.edges) {
      if (edge.relationship === "REALIZES") {
        const modId =
          edge.source === rn.id
            ? edge.target
            : edge.target === rn.id
            ? edge.source
            : null;
        if (modId) {
          const candidate = nodeMap.get(modId);
          if (candidate && candidate.type === "module") {
            if (!moduleIds.has(candidate.id)) {
              moduleIds.add(candidate.id);
              realizingModules.push((candidate.entity || {
              id: candidate.id,
              name: candidate.label,
              type: "module",
              filePath: candidate.filePath || "",
              loc: 0,
            }) as ModuleEntity);
            }
          }
        }
      }
    }

    // 3. Indirect method tests:
    // Module CONTAINS Method, Test VERIFIES Method
    const containedMethodIds = new Set<string>();
    for (const edge of graph.edges) {
      if (edge.relationship === "CONTAINS" && moduleIds.has(edge.source)) {
        const candidate = nodeMap.get(edge.target);
        if (candidate && candidate.type === "method") {
          containedMethodIds.add(candidate.id);
        }
      }
    }

    const indirectTests: TestEntity[] = [];
    const indirectTestIds = new Set<string>();
    for (const edge of graph.edges) {
      if (edge.relationship === "VERIFIES" && containedMethodIds.has(edge.target)) {
        const candidate = nodeMap.get(edge.source);
        if (candidate && candidate.type === "test" && !directTestIds.has(candidate.id)) {
          if (!indirectTestIds.has(candidate.id)) {
            indirectTestIds.add(candidate.id);
            indirectTests.push((candidate.entity || {
              id: candidate.id,
              name: candidate.label,
              type: "test",
              testType: "UNIT",
              status: "PASSED",
              framework: "Jest",
            }) as TestEntity);
          }
        }
      }
    }

    // Strict coverage evaluation:
    // FULL: Only when at least one valid direct Test (type === "test") VERIFIES the requirement
    // PARTIAL: Only indirect method tests exist, or realizing modules exist without tests
    // UNTESTED: No test verification links exist and no realizing code exists
    const hasDirectTests = directTests.length > 0;
    const hasIndirectTests = indirectTests.length > 0;
    const hasCode = realizingModules.length > 0;

    const coverageStatus: CoverageStatus = hasDirectTests
      ? "FULL"
      : (hasCode || hasIndirectTests)
      ? "PARTIAL"
      : "UNTESTED";

    const coverageScore = hasDirectTests ? 100 : hasCode ? 50 : 0;
    const displayedTests = hasDirectTests ? directTests : indirectTests;

    const containedMethods: MethodEntity[] = [];
    for (const mId of containedMethodIds) {
      const candidate = nodeMap.get(mId);
      if (candidate) {
        containedMethods.push((candidate.entity || {
          id: candidate.id,
          name: candidate.label,
          type: "method",
          signature: candidate.label,
          returnType: "void",
          visibility: "public",
        }) as MethodEntity);
      }
    }

    const missingLinks = !hasDirectTests
      ? [
          {
            tier: "test" as const,
            message: hasIndirectTests
              ? "Only indirect method tests mapped; no direct requirement verification test."
              : "No verification test mapped for this requirement.",
          },
        ]
      : undefined;

    return {
      requirement: reqEntity,
      architectureNodes: [],
      components: [],
      modules: realizingModules,
      classes: [],
      methods: containedMethods,
      tests: displayedTests,
      documents: [],
      coverageStatus,
      coverageScore,
      verificationSummary: {
        totalTests: directTests.length + indirectTests.length,
        // Never claim discovered tests have passed or executed
        passedTests: 0,
        failedTests: 0,
      },
      missingLinks,
    };
  });
}

export function computeTraceabilitySummary(
  rows: TraceabilityMatrixRow[]
): TraceabilitySummaryStats {
  const total = rows.length;
  const covered = rows.filter((r) => r.coverageStatus === "FULL").length;
  const partial = rows.filter((r) => r.coverageStatus === "PARTIAL").length;
  const untested = rows.filter((r) => r.coverageStatus === "UNTESTED").length;
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const totalTestsMapped = rows.reduce((acc, r) => acc + r.tests.length, 0);

  return {
    totalRequirements: total,
    fullyCovered: covered,
    partiallyCovered: partial,
    untested,
    coveragePercent: pct,
    totalTestsMapped,
    overallCoveragePercent: pct,
    fullyTraced: covered,
  };
}

export function resolveTraceabilityEntity(
  entityId: string,
  rows: TraceabilityMatrixRow[]
): { row: TraceabilityMatrixRow; entity: AnyTraceEntity } | null {
  if (!entityId || !rows || rows.length === 0) return null;
  const ep = entityId.toLowerCase();
  const directReq = rows.find((r) => r.requirement.id.toLowerCase() === ep);
  if (directReq) return { row: directReq, entity: directReq.requirement };
  for (const r of rows) {
    const m = r.modules.find((x) => x.id.toLowerCase() === ep);
    if (m) return { row: r, entity: m };
    const c = r.classes.find((x) => x.id.toLowerCase() === ep);
    if (c) return { row: r, entity: c };
    const meth = r.methods.find((x) => x.id.toLowerCase() === ep);
    if (meth) return { row: r, entity: meth };
    const t = r.tests.find((x) => x.id.toLowerCase() === ep);
    if (t) return { row: r, entity: t };
    const d = r.documents.find((x) => x.id.toLowerCase() === ep);
    if (d) return { row: r, entity: d };
  }
  return null;
}
