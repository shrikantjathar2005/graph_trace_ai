import { ApiResponse, GraphTraceApiService, ProjectMetadata } from "@/types/api";
import { KnowledgeGraphData } from "@/types/graph";
import { TraceabilityMatrixRow, TraceabilitySummaryStats } from "@/types/traceability";
import { ImpactAnalysisResult } from "@/types/impact";
import { mockProjectMetadata } from "./mock/mockProject";
import { mockKnowledgeGraph } from "./mock/mockGraphData";
import { mockTraceabilityRows, mockTraceabilitySummary } from "./mock/mockTraceability";
import { mockImpactPaymentResult } from "./mock/mockImpactData";
import {
  getImportedGraph,
  getImportedProject,
  getActiveProjectId,
  getProjectById,
} from "@/lib/graphStore";
import { evaluateRequirementTraceability, computeTraceabilitySummary, emptySummary } from "@/lib/traceabilityEngine";
import { computeRelationshipAwareImpact, emptyImpactResult } from "@/lib/impactEngine";
import { validateArchitectureRules } from "@/lib/ruleValidationEngine";
import { DEFAULT_ARCHITECTURE_RULES, ArchitectureRule, ValidationSummary } from "@/types/rules";



class MockApiService implements GraphTraceApiService {
  async getProjectSummary(projectId?: string): Promise<ApiResponse<ProjectMetadata>> {
    const activeId = projectId ?? getActiveProjectId();

    // 1. Explicitly identified demonstration project
    if (activeId === "fintrack") {
      return {
        data: mockProjectMetadata,
        success: true,
        executionTimeMs: 18,
      };
    }

    // 2. Imported Local Project
    if (activeId.startsWith("imported")) {
      const importedProj = getImportedProject(activeId);
      const importedGraph = getImportedGraph(activeId);

      if (importedProj) {
        const counts: Record<string, number> = {
          requirement: 0,
          architecture: 0,
          component: 0,
          module: 0,
          class: 0,
          method: 0,
          test: 0,
          documentation: 0,
        };

        if (importedGraph) {
          importedGraph.nodes.forEach((n) => {
            if (counts[n.type] !== undefined) {
              counts[n.type]++;
            }
          });
        }

        const totalLoc = importedGraph
          ? importedGraph.nodes.reduce((acc, n) => acc + (n.metrics?.loc ?? 0), 0)
          : 0;

        const metadata: ProjectMetadata = {
          id: importedProj.id,
          name: importedProj.name,
          repositoryUrl: "local://client-storage",
          defaultBranch: importedProj.branch,
          commitHash: "local-" + importedProj.id.slice(-6),
          languages: importedProj.stack
            ? importedProj.stack.split("/").map((s) => s.trim())
            : ["Multi-Language"],
          totalFilesParsed: importedProj.counts?.files ?? (importedGraph?.nodes.length || 0),
          totalLoc,
          lastIndexedAt: importedProj.importedAt ?? "Just now",
          // Honest status: Client heuristic parse is complete, but backend Neo4j & M3 are offline
          indexStatus: {
            m1Parser: "COMPLETED",
            m2Neo4j: "ERROR",
            m3Reasoning: "IDLE",
          },
          entityCounts: counts as ProjectMetadata["entityCounts"],
        };

        return {
          data: metadata,
          success: true,
          executionTimeMs: 12,
        };
      }
    }

    // 3. Unindexed Sample Project (e.g. ecommerce, payment, analytics)
    const sample = getProjectById(activeId);
    const zeroCounts: Record<string, number> = {
      requirement: 0,
      architecture: 0,
      component: 0,
      module: 0,
      class: 0,
      method: 0,
      test: 0,
      documentation: 0,
    };

    return {
      data: {
        id: sample?.id || activeId,
        name: sample?.name || "Unindexed Project",
        repositoryUrl: `https://github.com/sample/${sample?.id || "unindexed"}`,
        defaultBranch: sample?.branch || "main",
        commitHash: "unindexed",
        languages: sample?.stack ? sample.stack.split("/").map((s) => s.trim()) : [],
        totalFilesParsed: 0,
        totalLoc: 0,
        lastIndexedAt: "Not indexed",
        indexStatus: {
          m1Parser: "IDLE",
          m2Neo4j: "ERROR",
          m3Reasoning: "IDLE",
        },
        entityCounts: zeroCounts as ProjectMetadata["entityCounts"],
      },
      success: true,
      executionTimeMs: 10,
    };
  }

  async getKnowledgeGraph(filter?: {
    projectId?: string;
    entityTypes?: string[];
    search?: string;
  }): Promise<ApiResponse<KnowledgeGraphData>> {
    const activeId = filter?.projectId ?? getActiveProjectId();

    let graph: KnowledgeGraphData;
    if (activeId === "fintrack") {
      graph = mockKnowledgeGraph;
    } else if (activeId.startsWith("imported")) {
      graph = getImportedGraph(activeId) ?? { nodes: [], edges: [] };
    } else {
      // Un-indexed sample projects (e.g. ecommerce, payment, analytics)
      graph = { nodes: [], edges: [] };
    }

    // Filtering logic
    let nodes = [...graph.nodes];
    let edges = [...graph.edges];

    if (filter?.entityTypes && filter.entityTypes.length > 0) {
      const typeSet = new Set(filter.entityTypes);
      nodes = nodes.filter((n) => typeSet.has(n.type));
      const nodeIds = new Set(nodes.map((n) => n.id));
      edges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      nodes = nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q) ||
          (n.subtitle && n.subtitle.toLowerCase().includes(q))
      );
      const nodeIds = new Set(nodes.map((n) => n.id));
      edges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    return {
      data: { nodes, edges },
      success: true,
      executionTimeMs: 22,
    };
  }

  async getTraceabilityMatrix(projectId?: string): Promise<
    ApiResponse<{ rows: TraceabilityMatrixRow[]; summary: TraceabilitySummaryStats }>
  > {
    const activeId = projectId ?? getActiveProjectId();

    // 1. Explicit FinTrack demo
    if (activeId === "fintrack") {
      return {
        data: {
          rows: mockTraceabilityRows,
          summary: mockTraceabilitySummary,
        },
        success: true,
        executionTimeMs: 35,
      };
    }

    // 2. Imported project
    if (activeId.startsWith("imported")) {
      const graph = getImportedGraph(activeId);
      if (!graph || graph.nodes.length === 0) {
        return {
          data: {
            rows: [],
            summary: emptySummary,
          },
          success: true,
          executionTimeMs: 15,
        };
      }

      const rows = evaluateRequirementTraceability(graph);
      const summary = computeTraceabilitySummary(rows);

      return {
        data: {
          rows,
          summary,
        },
        success: true,
        executionTimeMs: 25,
      };
    }

    // 3. Un-indexed sample project
    return {
      data: {
        rows: [],
        summary: emptySummary,
      },
      success: true,
      executionTimeMs: 10,
    };
  }

  async getImpactAnalysis(
    targetId: string,
    changeType = "MODIFY_SIGNATURE",
    projectId?: string
  ): Promise<ApiResponse<ImpactAnalysisResult>> {
    const activeId = projectId ?? getActiveProjectId();

    // 1. Explicit FinTrack demo
    if (activeId === "fintrack") {
      return {
        data: {
          ...mockImpactPaymentResult,
          changeType: changeType as ImpactAnalysisResult["changeType"],
        },
        success: true,
        executionTimeMs: 40,
      };
    }

    // 2. Imported project: Compute genuine relationship-aware traversal
    if (activeId.startsWith("imported")) {
      const graph = getImportedGraph(activeId);
      if (!graph || graph.nodes.length === 0) {
        return {
          data: emptyImpactResult,
          success: false,
          message: "No knowledge graph available for this project. Please import code or requirements.",
          executionTimeMs: 10,
        };
      }

      const targetNode = graph.nodes.find((n) => n.id === targetId);
      if (!targetNode) {
        return {
          data: emptyImpactResult,
          success: false,
          message: `Target entity "${targetId}" was not found in ${getProjectById(activeId)?.name || "this project"}'s graph.`,
          executionTimeMs: 12,
        };
      }

      const result = computeRelationshipAwareImpact(graph, targetId, changeType);

      return {
        data: result,
        success: true,
        message: "Heuristic graph traversal (client sandbox). Calculated via 2-hop structural dependency propagation. This is a heuristic blast radius estimation, not a validated probability or measured business risk.",
        executionTimeMs: 25,
      };
    }

    // 3. Unindexed sample project
    return {
      data: emptyImpactResult,
      success: false,
      message: "Impact analysis is unavailable for unindexed sample projects. Select FinTrack Banking Core to explore demonstration blast-radius models.",
      executionTimeMs: 10,
    };
  }

  async queryNaturalLanguage(
    prompt: string,
    projectId?: string
  ): Promise<
    ApiResponse<{ answer: string; reasoningPath: string[]; confidence: number }>
  > {
    const activeId = projectId ?? getActiveProjectId();

    // 1. Explicit FinTrack demo queries
    if (activeId === "fintrack") {
      const query = prompt.toLowerCase();
      const graph = mockKnowledgeGraph;

      if (/(which|list|show).*(untested|missing tests|without tests)/.test(query)) {
        const uncovered = mockTraceabilityRows.filter((row) => row.tests.length === 0);
        return {
          data: {
            answer: uncovered.length
              ? "No test is mapped in the traceability matrix for: " + uncovered.map((row) => row.requirement.reqCode + " " + row.requirement.name).join("; ") + "."
              : "Every requirement currently has at least one test mapped in the traceability matrix.",
            reasoningPath: uncovered.map((row) => row.requirement.reqCode + " (" + row.coverageStatus.toLowerCase() + ")"),
            confidence: 0.96,
          },
          success: true,
          executionTimeMs: 28,
        };
      }

      const explicitId = graph.nodes.find((node) => query.includes(node.id.toLowerCase()));
      const topic = /audit|ledger|compliance/.test(query)
        ? /REQ-004/
        : /password|security|rate limit/.test(query)
          ? /REQ-003/
          : /auth|login|jwt|session|token/.test(query)
            ? /REQ-001/
            : /payment|transaction|idempoten|gateway/.test(query)
              ? /REQ-002/
              : null;
      const requirement = explicitId?.type === "requirement"
        ? explicitId
        : graph.nodes.find((node) => node.type === "requirement" && topic?.test(node.id));

      if (!requirement) {
        return {
          data: {
            answer: "I could not match that question to a requirement in FinTrack. Try a requirement ID (e.g. REQ-001) or a topic such as login, payments, password security, or audit.",
            reasoningPath: [],
            confidence: 0.2,
          },
          success: true,
          executionTimeMs: 24,
        };
      }

      const adjacency = new Map<string, string[]>();
      for (const edge of graph.edges) {
        adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
        adjacency.set(edge.target, [...(adjacency.get(edge.target) ?? []), edge.source]);
      }
      const previous = new Map<string, string | null>([[requirement.id, null]]);
      const queue = [requirement.id];
      while (queue.length) {
        const current = queue.shift()!;
        for (const neighbor of adjacency.get(current) ?? []) {
          if (!previous.has(neighbor)) {
            previous.set(neighbor, current);
            queue.push(neighbor);
          }
        }
      }

      const connectedTests = graph.nodes.filter((node) => node.type === "test" && previous.has(node.id));
      const mappedRow = mockTraceabilityRows.find((row) => row.requirement.id === requirement.id);
      const mappedTest = mappedRow?.tests[0];
      const path: string[] = [];
      const endpoint = mappedTest ?? connectedTests[0];
      if (endpoint) {
        let cursor: string | null = endpoint.id;
        while (cursor) {
          const node = graph.nodes.find((item) => item.id === cursor);
          if (node) path.push(node.label);
          cursor = previous.get(cursor) ?? null;
        }
        path.reverse();
      }
      const answer = mappedTest
        ? requirement.label + " has " + mappedRow!.tests.length + " test suite" + (mappedRow!.tests.length === 1 ? "" : "s") + " mapped in the traceability matrix (" + mappedRow!.coverageStatus.toLowerCase() + " coverage). The evidence path ends at " + mappedTest.name + "."
        : requirement.label + " has no test mapped to it in the traceability matrix (" + (mappedRow?.coverageStatus.toLowerCase() ?? "unknown") + " coverage). " +
          (connectedTests.length
            ? "Graph traversal can reach " + connectedTests.length + " related test artifact" + (connectedTests.length === 1 ? "" : "s") + " through code dependencies, which does not establish direct requirement verification."
            : "No connected test artifact was found in this graph.");

      return {
        data: {
          answer,
          reasoningPath: path,
          confidence: mappedRow ? 0.96 : 0.4,
        },
        success: true,
        executionTimeMs: 34,
      };
    }

    // 2. Imported project: Client-side graph search without leaking FinTrack data
    if (activeId.startsWith("imported")) {
      const graph = getImportedGraph(activeId);
      if (!graph || graph.nodes.length === 0) {
        return {
          data: {
            answer: `No knowledge graph nodes found for ${getProjectById(activeId)?.name || "this project"}. Ingest repository files to query entities.`,
            reasoningPath: [],
            confidence: 0,
          },
          success: true,
          executionTimeMs: 15,
        };
      }

      const query = prompt.toLowerCase();
      // Look for matched entity by ID or name
      const matchedNode = graph.nodes.find(
        (n) => query.includes(n.id.toLowerCase()) || query.includes(n.label.toLowerCase())
      );

      if (matchedNode) {
        const connectedEdges = graph.edges.filter(
          (e) => e.source === matchedNode.id || e.target === matchedNode.id
        );
        const neighborIds = connectedEdges.map((e) =>
          e.source === matchedNode.id ? e.target : e.source
        );
        const neighbors = graph.nodes.filter((n) => neighborIds.includes(n.id));

        const path = [
          `Matched Entity: ${matchedNode.label} [${matchedNode.type}]`,
          ...neighbors.map((n) => `Connected [${n.type}]: ${n.label}`),
        ];

        return {
          data: {
            answer: `Client graph traversal located "${matchedNode.label}" (${matchedNode.type}) with ${neighbors.length} connected entity links: ${neighbors.map((n) => n.label).join("; ") || "no connected nodes"}. Note: Client-side search uses direct graph relations; semantic vector reasoning requires the backend service.`,
            reasoningPath: path,
            confidence: 0.70,
          },
          success: true,
          executionTimeMs: 20,
        };
      }

      const availableReqs = graph.nodes.filter((n) => n.type === "requirement").map((n) => n.id);
      return {
        data: {
          answer: `Could not match "${prompt}" to an entity in ${getProjectById(activeId)?.name || "this project"}'s graph. ${
            availableReqs.length > 0
              ? `Available requirement entities: ${availableReqs.join(", ")}.`
              : "No requirement codes detected in this project."
          } Note: Semantic natural-language query requires the M3 reasoning backend.`,
          reasoningPath: [],
          confidence: 0.1,
        },
        success: true,
        executionTimeMs: 15,
      };
    }

    // 3. Unindexed sample project
    const projName = getProjectById(activeId)?.name || activeId;
    return {
      data: {
        answer: `Natural language query is unavailable for ${projName} because this project has not been indexed yet. Select FinTrack Banking Core to explore demonstration reasoning paths.`,
        reasoningPath: [],
        confidence: 0,
      },
      success: true,
      executionTimeMs: 10,
    };
  }

  async validateArchitectureRules(
    projectId?: string,
    rules?: ArchitectureRule[]
  ): Promise<ApiResponse<ValidationSummary>> {
    const activeId = projectId ?? getActiveProjectId();
    const rulesToRun = rules !== undefined ? rules : DEFAULT_ARCHITECTURE_RULES;

    const graphRes = await this.getKnowledgeGraph({ projectId: activeId });
    if (!graphRes.success || !graphRes.data) {
      return {
        data: validateArchitectureRules({ nodes: [], edges: [] }, rulesToRun),
        success: false,
        message: graphRes.message || "Failed to load knowledge graph for rule validation.",
        executionTimeMs: 5,
      };
    }

    const summary = validateArchitectureRules(graphRes.data, rulesToRun);
    return {
      data: summary,
      success: true,
      executionTimeMs: 25,
    };
  }

}

export const apiService: GraphTraceApiService = new MockApiService();
