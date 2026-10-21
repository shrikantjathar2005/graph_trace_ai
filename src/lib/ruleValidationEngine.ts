import type { KnowledgeGraphData, GraphNodeData, GraphRelationshipType } from "@/types/graph";
import type {
  ArchitectureRule,
  ValidationSummary,
  RuleSelector,
  FindingEvidence,
  RuleDirection,
} from "@/types/rules";
import type { RequirementEntity, RequirementPriority } from "@/types/entities";

const DEPENDENCY_RELATIONSHIPS = new Set<string>(["CALLS", "IMPORTS", "DEPENDS_ON", "EXTENDS"]);

export function isDependencyRelationship(rel: string): boolean {
  return DEPENDENCY_RELATIONSHIPS.has(rel);
}

/**
 * Checks if a graph node satisfies a selector pattern safely.
 */
export function matchesSelector(node: GraphNodeData, selector?: RuleSelector): boolean {
  if (!selector) return true;
  if (!node) return false;

  // 1. Entity type check
  if (selector.entityType && node.type !== selector.entityType) {
    return false;
  }

  // 2. Authoritative Priority check (for Requirement entities)
  if (selector.priority) {
    // Only requirement entities have a priority schema field
    if (node.type !== "requirement") {
      return false;
    }
    const reqEntity = node.entity && node.entity.type === "requirement"
      ? (node.entity as RequirementEntity)
      : undefined;
    const authoritativePriority = reqEntity?.priority ?? (node as { priority?: RequirementPriority }).priority;
    if (authoritativePriority !== selector.priority) {
      return false;
    }
  }

  // 3. Substring ID pattern check
  if (selector.idPattern && !node.id.toLowerCase().includes(selector.idPattern.toLowerCase())) {
    return false;
  }

  // 4. Substring Name pattern check
  if (selector.namePattern && !node.label.toLowerCase().includes(selector.namePattern.toLowerCase())) {
    return false;
  }

  // 5. File path pattern check (handles regex safely)
  if (selector.filePathPattern) {
    if (!node.filePath) return false;
    try {
      const reg = new RegExp(selector.filePathPattern, "i");
      if (!reg.test(node.filePath)) return false;
    } catch {
      // Safe fallback if user provided malformed regex
      if (!node.filePath.toLowerCase().includes(selector.filePathPattern.toLowerCase())) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates declared architecture rules against the active Software Knowledge Graph.
 * Strictly deterministic, grounded only in available graph evidence.
 */
export function validateArchitectureRules(
  graph: KnowledgeGraphData,
  rules?: ArchitectureRule[]
): ValidationSummary {
  const summary: ValidationSummary = {
    totalRulesEvaluated: 0,
    violationsCount: 0,
    passedCount: 0,
    insufficientEvidenceCount: 0,
    bySeverity: {
      ERROR: 0,
      WARNING: 0,
      INFO: 0,
    },
    findings: [],
  };

  if (!rules || !Array.isArray(rules)) {
    return summary;
  }

  const enabledRules = rules.filter((r) => r.enabled);
  summary.totalRulesEvaluated = enabledRules.length;

  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    for (const rule of enabledRules) {
      summary.insufficientEvidenceCount++;
      summary.findings.push({
        id: `finding-${rule.id}-empty-graph`,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        status: "INSUFFICIENT_EVIDENCE",
        message: "Knowledge graph contains zero entities. Cannot evaluate architectural rule.",
        evidence: [],
      });
    }
    return summary;
  }

  const nodeMap = new Map<string, GraphNodeData>(graph.nodes.map((n) => [n.id, n]));
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  for (const rule of enabledRules) {
    switch (rule.kind) {
      case "FORBIDDEN_DEPENDENCY": {
        evaluateForbiddenDependency(rule, graph.nodes, edges, nodeMap, summary);
        break;
      }
      case "REQUIRED_RELATIONSHIP": {
        evaluateRequiredRelationship(rule, graph.nodes, edges, nodeMap, summary);
        break;
      }
      case "CIRCULAR_DEPENDENCY": {
        evaluateCircularDependency(rule, graph.nodes, edges, nodeMap, summary);
        break;
      }
      default: {
        summary.insufficientEvidenceCount++;
        summary.findings.push({
          id: `finding-${rule.id}-unsupported`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          status: "INSUFFICIENT_EVIDENCE",
          message: `Unsupported rule kind: "${(rule as ArchitectureRule).kind}". No evaluation performed.`,
          evidence: [],
        });
        break;
      }
    }
  }

  return summary;
}

function evaluateForbiddenDependency(
  rule: ArchitectureRule,
  nodes: GraphNodeData[],
  edges: KnowledgeGraphData["edges"],
  nodeMap: Map<string, GraphNodeData>,
  summary: ValidationSummary
) {
  const sources = nodes.filter((n) => matchesSelector(n, rule.source));
  if (sources.length === 0) {
    summary.insufficientEvidenceCount++;
    summary.findings.push({
      id: `finding-${rule.id}-no-sources`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "INSUFFICIENT_EVIDENCE",
      message: `No entities matching source selector (${rule.source.entityType || "any"}) discovered in graph.`,
      evidence: [],
      evaluatedEntityCount: 0,
    });
    return;
  }

  const forbiddenRelSet = new Set<string>(
    rule.forbiddenRelationships && rule.forbiddenRelationships.length > 0
      ? rule.forbiddenRelationships
      : ["CALLS", "IMPORTS", "DEPENDS_ON", "EXTENDS"]
  );

  const violations: FindingEvidence[] = [];
  let evaluatedEdgesCount = 0;
  let hasHeuristicEdges = false;

  for (const src of sources) {
    for (const edge of edges) {
      // Direction is strictly SOURCE -> TARGET
      if (edge.source === src.id && forbiddenRelSet.has(edge.relationship)) {
        evaluatedEdgesCount++;
        if (edge.confidence !== undefined && edge.confidence < 1.0) {
          hasHeuristicEdges = true;
        }

        const targetNode = nodeMap.get(edge.target);
        if (targetNode && matchesSelector(targetNode, rule.target)) {
          violations.push({
            sourceEntityId: src.id,
            sourceEntityName: src.label,
            sourceEntityType: src.type,
            targetEntityId: targetNode.id,
            targetEntityName: targetNode.label,
            targetEntityType: targetNode.type,
            relationship: edge.relationship,
            edgeId: edge.id,
            confidence: edge.confidence,
          });
        }
      }
    }
  }

  if (violations.length > 0) {
    summary.violationsCount += violations.length;
    summary.bySeverity[rule.severity] += violations.length;

    const hasHeuristicViolation = violations.some((v) => v.confidence !== undefined && v.confidence < 1.0);

    const violationKey = violations
      .map((v) => `${v.sourceEntityId}->${v.targetEntityId}`)
      .sort()
      .join(";");

    summary.findings.push({
      id: `finding-${rule.id}-forbidden-${violationKey}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "VIOLATION",
      message: `Discovered ${violations.length} forbidden ${rule.source.entityType || "source"} -> ${rule.target?.entityType || "target"} dependenc${violations.length === 1 ? "y" : "ies"}.`,
      evidence: violations,
      remediationAdvice: "Refactor communication to decouple the layers or introduce an intermediary domain boundary.",
      isHeuristicEvidence: hasHeuristicViolation,
      evaluatedEntityCount: sources.length,
    });
  } else {
    summary.passedCount++;
    const passMessage = evaluatedEdgesCount > 0
      ? `No forbidden dependencies observed in available graph evidence across ${sources.length} evaluated ${rule.source.entityType || "entity"}(s) (${evaluatedEdgesCount} outgoing edges inspected).`
      : `No outgoing dependency edges observed from ${sources.length} evaluated ${rule.source.entityType || "entity"}(s) in available graph evidence.`;

    summary.findings.push({
      id: `finding-${rule.id}-passed`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "PASSED",
      message: passMessage,
      evidence: [],
      isHeuristicEvidence: hasHeuristicEdges,
      evaluatedEntityCount: sources.length,
    });
  }
}

function evaluateRequiredRelationship(
  rule: ArchitectureRule,
  nodes: GraphNodeData[],
  edges: KnowledgeGraphData["edges"],
  nodeMap: Map<string, GraphNodeData>,
  summary: ValidationSummary
) {
  const sources = nodes.filter((n) => matchesSelector(n, rule.source));
  if (sources.length === 0) {
    summary.insufficientEvidenceCount++;
    summary.findings.push({
      id: `finding-${rule.id}-no-sources`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "INSUFFICIENT_EVIDENCE",
      message: `No entities matching required source selector (${rule.source.entityType || "any"}${rule.source.priority ? ` [priority: ${rule.source.priority}]` : ""}) found in graph.`,
      evidence: [],
      evaluatedEntityCount: 0,
    });
    return;
  }

  const reqRel = rule.requiredRelationship;
  if (!reqRel) {
    summary.insufficientEvidenceCount++;
    summary.findings.push({
      id: `finding-${rule.id}-no-required-rel`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "INSUFFICIENT_EVIDENCE",
      message: "Rule does not specify requiredRelationship.",
      evidence: [],
      evaluatedEntityCount: sources.length,
    });
    return;
  }

  // Check if target layer has ANY entities in the graph
  const targetCandidates = nodes.filter((n) => matchesSelector(n, rule.target));
  if (targetCandidates.length === 0) {
    summary.insufficientEvidenceCount++;
    summary.findings.push({
      id: `finding-${rule.id}-no-targets`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "INSUFFICIENT_EVIDENCE",
      message: `Target layer "${rule.target?.entityType || "target"}" has zero entities in knowledge graph; cannot verify required "${reqRel}" relationship.`,
      evidence: [],
      evaluatedEntityCount: sources.length,
    });
    return;
  }

  // Determine explicit or semantic default direction:
  // - VERIFIES and DOCUMENTS: standard direction is target -> source (e.g. Test --VERIFIES--> Req, Doc --DOCUMENTS--> Code)
  // - REALIZES, CONTAINS, IMPLEMENTS: standard direction is source -> target
  const direction: RuleDirection = rule.direction ?? (
    reqRel === "VERIFIES" || reqRel === "DOCUMENTS" ? "TARGET_TO_SOURCE" : "SOURCE_TO_TARGET"
  );

  const unlinkedEntities: FindingEvidence[] = [];
  const satisfiedEvidence: FindingEvidence[] = [];

  for (const src of sources) {
    let hasSatisfyingLink = false;

    for (const edge of edges) {
      if (edge.relationship !== reqRel) continue;

      if (direction === "TARGET_TO_SOURCE") {
        // Expected: Target --[reqRel]--> Source
        if (edge.target === src.id) {
          const partner = nodeMap.get(edge.source);
          if (partner && matchesSelector(partner, rule.target)) {
            hasSatisfyingLink = true;
            satisfiedEvidence.push({
              sourceEntityId: src.id,
              sourceEntityName: src.label,
              sourceEntityType: src.type,
              targetEntityId: partner.id,
              targetEntityName: partner.label,
              targetEntityType: partner.type,
              relationship: edge.relationship,
              edgeId: edge.id,
              confidence: edge.confidence,
            });
            break;
          }
        }
      } else {
        // Expected: Source --[reqRel]--> Target
        if (edge.source === src.id) {
          const partner = nodeMap.get(edge.target);
          if (partner && matchesSelector(partner, rule.target)) {
            hasSatisfyingLink = true;
            satisfiedEvidence.push({
              sourceEntityId: src.id,
              sourceEntityName: src.label,
              sourceEntityType: src.type,
              targetEntityId: partner.id,
              targetEntityName: partner.label,
              targetEntityType: partner.type,
              relationship: edge.relationship,
              edgeId: edge.id,
              confidence: edge.confidence,
            });
            break;
          }
        }
      }
    }

    if (!hasSatisfyingLink) {
      unlinkedEntities.push({
        sourceEntityId: src.id,
        sourceEntityName: src.label,
        sourceEntityType: src.type,
      });
    }
  }

  if (unlinkedEntities.length > 0) {
    summary.violationsCount += unlinkedEntities.length;
    summary.bySeverity[rule.severity] += unlinkedEntities.length;

    const missingKey = unlinkedEntities
      .map((e) => e.sourceEntityId)
      .sort()
      .join(";");

    summary.findings.push({
      id: `finding-${rule.id}-missing-${missingKey}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "VIOLATION",
      message: `${unlinkedEntities.length} ${rule.source.entityType || "entity"}(s) lack required "${reqRel}" relationship (${direction === "TARGET_TO_SOURCE" ? "incoming from" : "outgoing to"} ${rule.target?.entityType || "target"}).`,
      evidence: unlinkedEntities,
      remediationAdvice: `Add or document missing ${reqRel} edge connecting ${direction === "TARGET_TO_SOURCE" ? "from" : "to"} an appropriate ${rule.target?.entityType || "target"} artifact.`,
      evaluatedEntityCount: sources.length,
    });
  } else {
    summary.passedCount++;
    const hasHeuristic = satisfiedEvidence.some((e) => e.confidence !== undefined && e.confidence < 1.0);

    summary.findings.push({
      id: `finding-${rule.id}-passed`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "PASSED",
      message: `All ${sources.length} evaluated ${rule.source.entityType || "entity"}(s) satisfy required ${reqRel} relationship in available graph evidence.`,
      evidence: satisfiedEvidence,
      isHeuristicEvidence: hasHeuristic,
      evaluatedEntityCount: sources.length,
    });
  }
}

interface DirectedCycle {
  nodes: string[];
  edges: Array<{
    source: string;
    target: string;
    relationship: GraphRelationshipType;
    edgeId: string;
    confidence?: number;
  }>;
}

/**
 * Elementary Cycle Detection via Johnson's Algorithm (1975).
 *
 * Definition of a distinct cycle:
 * An elementary cycle is a directed closed walk (v_0 -> v_1 -> ... -> v_k -> v_0)
 * where all vertices v_0 ... v_k are distinct (except the start/end).
 * Two cycles are considered identical if they are cyclic permutations of each other
 * (e.g. A -> B -> C -> A is identical to B -> C -> A -> B).
 *
 * Johnson's algorithm guarantees:
 * 1. Each elementary cycle is enumerated exactly once with v_0 = min_{v in cycle}(v).
 * 2. No cycles are missed in overlapping, nested, or shared-node topologies.
 * 3. Self-loops (v -> v) and 2-node cycles (A -> B -> A) are fully supported.
 * 4. Traversal is strictly restricted to declared dependency relationship types.
 */
function evaluateCircularDependency(
  rule: ArchitectureRule,
  nodes: GraphNodeData[],
  edges: KnowledgeGraphData["edges"],
  nodeMap: Map<string, GraphNodeData>,
  summary: ValidationSummary
) {
  const targetNodes = nodes.filter((n) => matchesSelector(n, rule.source));
  if (targetNodes.length === 0) {
    summary.insufficientEvidenceCount++;
    summary.findings.push({
      id: `finding-${rule.id}-no-nodes`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "INSUFFICIENT_EVIDENCE",
      message: "No entities match circular dependency selector.",
      evidence: [],
      evaluatedEntityCount: 0,
    });
    return;
  }

  const sortedTargetIds = targetNodes.map((n) => n.id).sort();
  const idToIndex = new Map<string, number>(sortedTargetIds.map((id, idx) => [id, idx]));
  const n = sortedTargetIds.length;

  const allowedRels = new Set<string>(
    rule.forbiddenRelationships && rule.forbiddenRelationships.length > 0
      ? rule.forbiddenRelationships
      : ["CALLS", "IMPORTS", "DEPENDS_ON", "EXTENDS"]
  );

  interface IndexedEdge {
    source: string;
    target: string;
    targetIdx: number;
    edgeId: string;
    relationship: GraphRelationshipType;
    confidence?: number;
  }

  const adj: IndexedEdge[][] = Array.from({ length: n }, () => []);
  for (const edge of edges) {
    if (allowedRels.has(edge.relationship)) {
      const u = idToIndex.get(edge.source);
      const v = idToIndex.get(edge.target);
      if (u !== undefined && v !== undefined) {
        adj[u].push({
          source: edge.source,
          target: edge.target,
          targetIdx: v,
          edgeId: edge.id,
          relationship: edge.relationship,
          confidence: edge.confidence,
        });
      }
    }
  }

  const uniqueCycles: DirectedCycle[] = [];
  const seenCycleSignatures = new Set<string>();

  const blocked: boolean[] = new Array(n).fill(false);
  const B: number[][] = Array.from({ length: n }, () => []);
  const stack: number[] = [];
  const edgeStack: IndexedEdge[] = [];

  function unblock(u: number) {
    blocked[u] = false;
    while (B[u].length > 0) {
      const w = B[u].pop()!;
      if (blocked[w]) {
        unblock(w);
      }
    }
  }

  function circuit(v: number, s: number): boolean {
    let f = false;
    stack.push(v);
    blocked[v] = true;

    for (const edge of adj[v]) {
      const w = edge.targetIdx;
      if (w < s) continue; // Only consider vertices in induced subgraph >= s

      if (w === s) {
        edgeStack.push(edge);
        const cycleNodeIds = [...stack.map((idx) => sortedTargetIds[idx]), sortedTargetIds[s]];
        const sig = cycleNodeIds.join("->");
        if (!seenCycleSignatures.has(sig)) {
          seenCycleSignatures.add(sig);
          uniqueCycles.push({
            nodes: cycleNodeIds,
            edges: [...edgeStack],
          });
        }
        edgeStack.pop();
        f = true;
      } else if (!blocked[w]) {
        edgeStack.push(edge);
        if (circuit(w, s)) {
          f = true;
        }
        edgeStack.pop();
      }
    }

    if (f) {
      unblock(v);
    } else {
      for (const edge of adj[v]) {
        const w = edge.targetIdx;
        if (w >= s && !B[w].includes(v)) {
          B[w].push(v);
        }
      }
    }

    stack.pop();
    return f;
  }

  for (let s = 0; s < n; s++) {
    for (let i = s; i < n; i++) {
      blocked[i] = false;
      B[i] = [];
    }
    circuit(s, s);
  }

  if (uniqueCycles.length > 0) {
    summary.violationsCount += uniqueCycles.length;
    summary.bySeverity[rule.severity] += uniqueCycles.length;

    const evidenceList: FindingEvidence[] = [];
    let hasHeuristic = false;

    for (const cyc of uniqueCycles) {
      for (const e of cyc.edges) {
        const sNode = nodeMap.get(e.source);
        const tNode = nodeMap.get(e.target);
        if (e.confidence !== undefined && e.confidence < 1.0) hasHeuristic = true;

        evidenceList.push({
          sourceEntityId: e.source,
          sourceEntityName: sNode?.label || e.source,
          sourceEntityType: sNode?.type || "module",
          targetEntityId: e.target,
          targetEntityName: tNode?.label || e.target,
          targetEntityType: tNode?.type || "module",
          relationship: e.relationship,
          edgeId: e.edgeId,
          confidence: e.confidence,
        });
      }
    }

    // Deterministic finding ID based on canonical cycle representations
    const cycleKeys = uniqueCycles.map((c) => c.nodes.join("->")).sort().join(";");

    summary.findings.push({
      id: `finding-${rule.id}-cycle-${cycleKeys}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "VIOLATION",
      message: `Detected ${uniqueCycles.length} distinct circular dependency cycle${uniqueCycles.length === 1 ? "" : "s"} within ${rule.source.entityType || "selected"} layer.`,
      evidence: evidenceList,
      remediationAdvice: "Break the cycle by applying Dependency Inversion (DIP) or extracting shared interfaces.",
      isHeuristicEvidence: hasHeuristic,
      evaluatedEntityCount: targetNodes.length,
    });
  } else {
    summary.passedCount++;
    summary.findings.push({
      id: `finding-${rule.id}-passed`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: "PASSED",
      message: `Zero circular dependency cycles detected across ${targetNodes.length} evaluated entities in available graph evidence.`,
      evidence: [],
      evaluatedEntityCount: targetNodes.length,
    });
  }
}
