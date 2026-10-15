import { AnyTraceEntity, EntityType } from "./entities";

export type GraphRelationshipType =
  | "IMPLEMENTS"
  | "REALIZES"
  | "CONTAINS"
  | "CALLS"
  | "DEPENDS_ON"
  | "VERIFIES"
  | "DOCUMENTS"
  | "EXTENDS"
  | "IMPORTS";

export interface GraphNodeData {
  id: string;
  label: string;
  type: EntityType;
  subtitle?: string;
  filePath?: string;
  entity: AnyTraceEntity;
  metrics?: {
    loc?: number;
    methods?: number;
    testsCount?: number;
    complexity?: number;
  };
  highlighted?: boolean;
  selected?: boolean;
  risk?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  relationship: GraphRelationshipType;
  confidence?: number; // e.g. 0.95 for AST-derived, 0.85 for semantic
  highlighted?: boolean;
  bidirectional?: boolean;
}

export interface KnowledgeGraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

export interface GraphFilterOptions {
  searchQuery: string;
  activeEntityTypes: Set<EntityType>;
  relationshipTypes: Set<GraphRelationshipType>;
  depth: number;
  showOrphanNodes: boolean;
}
