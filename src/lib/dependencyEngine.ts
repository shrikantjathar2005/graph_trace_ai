import type { GraphRelationshipType } from "../types/graph";

/**
 * Explicit Code and Architecture Dependency Relationships
 *
 * Excludes structural containment (CONTAINS), verification (VERIFIES),
 * and documentation (DOCUMENTS), which do not represent code invocation
 * or module coupling.
 */
export const DEPENDENCY_RELATIONSHIP_TYPES: ReadonlyArray<GraphRelationshipType> = [
  "CALLS",
  "IMPORTS",
  "DEPENDS_ON",
  "EXTENDS",
];

export function isDependencyRelationship(relationship: string): boolean {
  return (DEPENDENCY_RELATIONSHIP_TYPES as readonly string[]).includes(relationship);
}

export function isDependencyEdge(edge: { relationship: string }): boolean {
  return isDependencyRelationship(edge.relationship);
}

export function countDependencyEdges(edges: Array<{ relationship: string }>): number {
  if (!Array.isArray(edges)) return 0;
  return edges.filter(isDependencyEdge).length;
}
