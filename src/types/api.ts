import { KnowledgeGraphData } from "./graph";
import { TraceabilityMatrixRow, TraceabilitySummaryStats } from "./traceability";
import { ImpactAnalysisResult } from "./impact";
import { EntityType } from "./entities";

export interface ProjectMetadata {
  id: string;
  name: string;
  repositoryUrl: string;
  defaultBranch: string;
  commitHash: string;
  languages: string[];
  totalFilesParsed: number;
  totalLoc: number;
  lastIndexedAt: string;
  indexStatus: {
    m1Parser: "IDLE" | "PARSING" | "COMPLETED" | "ERROR";
    m2Neo4j: "CONNECTED" | "SYNCING" | "ERROR";
    m3Reasoning: "ACTIVE" | "IDLE" | "ERROR";
  };
  entityCounts: Record<EntityType, number>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  executionTimeMs?: number;
}

export interface GraphTraceApiService {
  getProjectSummary(): Promise<ApiResponse<ProjectMetadata>>;
  getKnowledgeGraph(filter?: { entityTypes?: EntityType[]; search?: string }): Promise<ApiResponse<KnowledgeGraphData>>;
  getTraceabilityMatrix(): Promise<ApiResponse<{ rows: TraceabilityMatrixRow[]; summary: TraceabilitySummaryStats }>>;
  getImpactAnalysis(targetId: string, changeType?: string): Promise<ApiResponse<ImpactAnalysisResult>>;
  queryNaturalLanguage(prompt: string): Promise<ApiResponse<{ answer: string; reasoningPath: string[]; confidence: number }>>;
}
