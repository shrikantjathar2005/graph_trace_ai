import { ApiResponse, GraphTraceApiService, ProjectMetadata } from "@/types/api";
import { KnowledgeGraphData } from "@/types/graph";
import { TraceabilityMatrixRow, TraceabilitySummaryStats } from "@/types/traceability";
import { ImpactAnalysisResult } from "@/types/impact";
import { mockProjectMetadata } from "./mock/mockProject";
import { mockKnowledgeGraph } from "./mock/mockGraphData";
import { mockTraceabilityRows, mockTraceabilitySummary } from "./mock/mockTraceability";
import { mockImpactPaymentResult } from "./mock/mockImpactData";
import { getImportedGraph } from "@/lib/graphStore";

class MockApiService implements GraphTraceApiService {
  async getProjectSummary(): Promise<ApiResponse<ProjectMetadata>> {
    return {
      data: mockProjectMetadata,
      success: true,
      executionTimeMs: 18,
    };
  }

  async getKnowledgeGraph(filter?: {
    entityTypes?: string[];
    search?: string;
  }): Promise<ApiResponse<KnowledgeGraphData>> {
    const graph = getImportedGraph() ?? mockKnowledgeGraph;
    let filteredNodes = [...graph.nodes];
    if (filter?.entityTypes && filter.entityTypes.length > 0) {
      filteredNodes = filteredNodes.filter((n) => filter.entityTypes!.includes(n.type));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      filteredNodes = filteredNodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q) ||
          n.subtitle?.toLowerCase().includes(q)
      );
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = graph.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    return {
      data: {
        nodes: filteredNodes,
        edges: filteredEdges,
      },
      success: true,
      executionTimeMs: 34,
    };
  }

  async getTraceabilityMatrix(): Promise<
    ApiResponse<{ rows: TraceabilityMatrixRow[]; summary: TraceabilitySummaryStats }>
  > {
    return {
      data: {
        rows: mockTraceabilityRows,
        summary: mockTraceabilitySummary,
      },
      success: true,
      executionTimeMs: 45,
    };
  }

  async getImpactAnalysis(
    targetId: string,
    changeType = "MODIFY_SIGNATURE"
  ): Promise<ApiResponse<ImpactAnalysisResult>> {
    return {
      data: {
        ...mockImpactPaymentResult,
        changeType: changeType as ImpactAnalysisResult["changeType"],
      },
      success: true,
      executionTimeMs: 62,
    };
  }

  async queryNaturalLanguage(prompt: string): Promise<
    ApiResponse<{ answer: string; reasoningPath: string[]; confidence: number }>
  > {
    const query = prompt.toLowerCase();
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

    const explicitId = mockKnowledgeGraph.nodes.find((node) => query.includes(node.id.toLowerCase()));
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
      : mockKnowledgeGraph.nodes.find((node) => node.type === "requirement" && topic?.test(node.id));

    if (!requirement) {
      return {
        data: {
          answer: "I could not match that question to a requirement in this project graph. Try a requirement ID or a topic such as login, payments, password security, or audit.",
          reasoningPath: [],
          confidence: 0.2,
        },
        success: true,
        executionTimeMs: 24,
      };
    }

    const adjacency = new Map<string, string[]>();
    for (const edge of mockKnowledgeGraph.edges) {
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

    const connectedTests = mockKnowledgeGraph.nodes.filter((node) => node.type === "test" && previous.has(node.id));
    const mappedRow = mockTraceabilityRows.find((row) => row.requirement.id === requirement.id);
    const mappedTest = mappedRow?.tests[0];
    const path: string[] = [];
    const endpoint = mappedTest ?? connectedTests[0];
    if (endpoint) {
      let cursor: string | null = endpoint.id;
      while (cursor) {
        const node = mockKnowledgeGraph.nodes.find((item) => item.id === cursor);
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
}

export const apiService: GraphTraceApiService = new MockApiService();
