/**
 * Relationship-Aware Impact Propagation Engine
 *
 * Scoring Formula:
 *   riskScore = Math.min(100, directAffectedCount * 20 + indirectAffectedCount * 10)
 *
 * Classification Thresholds:
 *   - CRITICAL : riskScore >= 80 (4+ direct dependencies or maximum blast radius)
 *   - HIGH     : riskScore >= 50 (2-3 direct dependencies or broad indirect coupling)
 *   - MEDIUM   : riskScore >= 20 (1 direct dependency or multiple indirect couplings)
 *   - LOW      : riskScore < 20  (isolated leaf entity or minimal coupling)
 *
 * NOTE: The risk score is a topological connectivity heuristic measuring the structural
 * blast radius within the knowledge graph. It is NOT a probabilistic failure prediction
 * or test failure likelihood.
 *
 * Traversal Semantics (by relationship type):
 *   - CALLS: Caller (source) calls Callee (target). When target changes, caller is impacted.
 *   - VERIFIES: Test (source) verifies Unit (target). When target changes, test is impacted.
 *   - CONTAINS: Module/Class (source) contains Member (target). Bidirectional impact:
 *       modifying target impacts container; modifying container impacts member.
 *   - REALIZES: Architecture/Module (target) realizes Requirement (source), or Module realizes Requirement.
 *       Bidirectional: changing target impacts requirement; changing requirement impacts realization.
 *   - DOCUMENTS: Doc (source) documents Entity (target). When target changes, doc is out of sync.
 *   - DEPENDS_ON / IMPORTS: Consumer (source) imports/depends on Provider (target).
 *       When target changes, consumer is impacted.
 */
import type { KnowledgeGraphData } from "@/types/graph";
import type {
  ImpactAnalysisResult,
  AffectedEntityItem,
  ImpactRiskLevel,
} from "@/types/impact";

export const emptyImpactResult: ImpactAnalysisResult = {
  targetEntity: {
    id: "NONE",
    name: "None",
    type: "module",
    filePath: "",
    language: "TypeScript",
    loc: 0,
    imports: [],
  },
  changeType: "MODIFY_SIGNATURE",
  overallRisk: "LOW",
  riskScore: 0,
  directAffectedCount: 0,
  indirectAffectedCount: 0,
  affectededTestCount: 0,
  affectedRequirementsCount: 0,
  affectedDocsCount: 0,
  affectedItems: [],
  suggestedTestSuites: [],
  suggestedDocsToUpdate: [],
};

export function computeRelationshipAwareImpact(
  graph: KnowledgeGraphData,
  targetId: string,
  changeType = "MODIFY_SIGNATURE"
): ImpactAnalysisResult {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return emptyImpactResult;
  }

  const targetNode = graph.nodes.find((n) => n.id === targetId);
  if (!targetNode) {
    return emptyImpactResult;
  }

  // Relationship-aware propagation graph construction:
  // - If Target changes: Caller (via CALLS), Test (via VERIFIES), Parent Module (via CONTAINS),
  //   Requirement (via REALIZES), and Documentation (via DOCUMENTS) are impacted.
  // - If Source changes: For CONTAINS, constituent methods/classes are impacted; for REALIZES, realizing module is impacted.
  const propagationMap = new Map<string, Array<{ neighbor: string; reason: string }>>();

  const addProp = (fromId: string, toId: string, reason: string) => {
    if (!propagationMap.has(fromId)) propagationMap.set(fromId, []);
    propagationMap.get(fromId)!.push({ neighbor: toId, reason });
  };

  for (const e of graph.edges) {
    const rel = e.relationship;

    // When e.target changes:
    if (rel === "CALLS") {
      addProp(e.target, e.source, "Caller invokes target and may fail parameter contract");
    } else if (rel === "VERIFIES") {
      addProp(e.target, e.source, "Verification test suite will be affected by changes to target entity");
    } else if (rel === "CONTAINS") {
      addProp(e.target, e.source, "Parent module containing this unit may require interface updates");
      addProp(e.source, e.target, "Enclosing module modification directly impacts constituent member");
    } else if (rel === "REALIZES") {
      addProp(e.target, e.source, "Requirement acceptance criteria may be breached by implementation change");
      addProp(e.source, e.target, "Requirement definition change requires updating realizing module");
    } else if (rel === "DOCUMENTS") {
      addProp(e.target, e.source, "Documentation specification references target and may become out-of-sync");
    } else if (rel === "DEPENDS_ON" || rel === "IMPORTS") {
      addProp(e.target, e.source, "Dependent unit relies on target and may break on interface changes");
    } else {
      // Fallback for custom or unmapped edges: undirected structural traversal
      addProp(e.target, e.source, `Structural ${rel.toLowerCase()} link (undirected heuristic propagation)`);
      addProp(e.source, e.target, `Structural ${rel.toLowerCase()} link (undirected heuristic propagation)`);
    }
  }

  const hopDistance = new Map<string, number>();
  const impactReasons = new Map<string, string>();
  hopDistance.set(targetId, 0);

  const queue: Array<{ id: string; depth: number }> = [{ id: targetId, depth: 0 }];
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth >= 2) continue; // 2-hop blast radius boundary

    for (const item of propagationMap.get(id) || []) {
      if (!hopDistance.has(item.neighbor)) {
        hopDistance.set(item.neighbor, depth + 1);
        impactReasons.set(
          item.neighbor,
          `${depth === 0 ? "Direct 1-hop" : "Indirect 2-hop"}: ${item.reason}`
        );
        queue.push({ id: item.neighbor, depth: depth + 1 });
      }
    }
  }

  const affectedItems: AffectedEntityItem[] = Array.from(hopDistance.entries())
    .filter(([nodeId]) => nodeId !== targetId)
    .map(([nodeId, dist]) => {
      const node = graph.nodes.find((n) => n.id === nodeId);
      const isDirect = dist === 1;
      return {
        entityId: nodeId,
        entityName: node?.label || nodeId,
        entityType: node?.type || ("module" as const),
        filePath: node?.filePath,
        hopDistance: dist,
        impactReason: impactReasons.get(nodeId) || "Connected in knowledge graph",
        riskLevel: (isDirect ? "HIGH" : "MEDIUM") as ImpactRiskLevel,
        isTestBroken: false,
      };
    });

  const direct = affectedItems.filter((i) => i.hopDistance === 1).length;
  const indirect = affectedItems.filter((i) => i.hopDistance > 1).length;
  const testsAtRisk = affectedItems.filter((i) => i.entityType === "test").length;
  const docsAtRisk = affectedItems.filter((i) => i.entityType === "documentation").length;
  const reqsAtRisk = affectedItems.filter((i) => i.entityType === "requirement").length;

  // Heuristic risk score based on topological connectivity:
  // 20 points per direct (1-hop) affected entity + 10 points per indirect (2-hop) affected entity, capped at 100.
  // Note: This score measures structural connectivity in the knowledge graph, NOT a probability of execution failure.
  const riskScore = Math.min(100, direct * 20 + indirect * 10);
  const overallRisk: ImpactRiskLevel =
    riskScore >= 80 ? "CRITICAL" : riskScore >= 50 ? "HIGH" : riskScore >= 20 ? "MEDIUM" : "LOW";

  return {
    targetEntity: targetNode.entity || {
      id: targetNode.id,
      name: targetNode.label,
      type: "module",
      filePath: targetNode.filePath || "",
      loc: 0,
    },
    changeType: changeType as ImpactAnalysisResult["changeType"],
    overallRisk,
    riskScore,
    directAffectedCount: direct,
    indirectAffectedCount: indirect,
    affectededTestCount: testsAtRisk,
    affectedRequirementsCount: reqsAtRisk,
    affectedDocsCount: docsAtRisk,
    affectedItems,
    suggestedTestSuites: affectedItems
      .filter((i) => i.entityType === "test")
      .map((i) => i.entityName),
    suggestedDocsToUpdate: affectedItems
      .filter((i) => i.entityType === "documentation")
      .map((i) => i.entityName),
  };
}
