import { KnowledgeGraphData } from "./graph";
import { TraceabilityMatrixRow, TraceabilitySummaryStats } from "./traceability";
import { ImpactAnalysisResult } from "./impact";
import { EntityType } from "./entities";
import type { ArchitectureRule, ValidationSummary } from "./rules";

export type ProjectStatus =
  | "completed"
  | "completed_with_warnings"
  | "indexing"
  | "not_indexed"
  | "failed";

export interface ProjectInfo {
  id: string;
  name: string;
  branch: string;
  stack: string;
  isSample: boolean;
  sourceType: "sample" | "upload" | "git";
  status: ProjectStatus;
  importedAt?: string;
  description?: string;
  counts?: {
    files?: number;
    requirements?: number;
    modules?: number;
    methods?: number;
    tests?: number;
    relationships?: number;
    unresolvedLinks?: number;
  };
  warnings?: string[];
}

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
  getProjectSummary(projectId?: string): Promise<ApiResponse<ProjectMetadata>>;
  getKnowledgeGraph(filter?: {
    projectId?: string;
    entityTypes?: EntityType[];
    search?: string;
  }): Promise<ApiResponse<KnowledgeGraphData>>;
  getTraceabilityMatrix(projectId?: string): Promise<
    ApiResponse<{ rows: TraceabilityMatrixRow[]; summary: TraceabilitySummaryStats }>
  >;
  getImpactAnalysis(
    targetId: string,
    changeType?: string,
    projectId?: string
  ): Promise<ApiResponse<ImpactAnalysisResult>>;
  queryNaturalLanguage(
    prompt: string,
    projectId?: string
  ): Promise<ApiResponse<{ answer: string; reasoningPath: string[]; confidence: number }>>;
  validateArchitectureRules(
    projectId?: string,
    rules?: ArchitectureRule[]
  ): Promise<ApiResponse<ValidationSummary>>;
}
