import type { EntityType, RequirementPriority } from "./entities";
import type { GraphRelationshipType } from "./graph";

export type RuleSeverity = "ERROR" | "WARNING" | "INFO";

export type RuleKind =
  | "FORBIDDEN_DEPENDENCY"       // Source entity/layer must NOT have specified relationship to target entity/layer
  | "REQUIRED_RELATIONSHIP"      // Source entity/layer MUST have specified relationship to target entity/layer
  | "CIRCULAR_DEPENDENCY";       // Source entity/layer must NOT have mutual or cycle dependencies

export type RuleDirection = "SOURCE_TO_TARGET" | "TARGET_TO_SOURCE";

export interface RuleSelector {
  entityType?: EntityType;
  idPattern?: string;          // Substring or prefix match on entity ID (case-insensitive)
  namePattern?: string;        // Substring match on entity label/name
  filePathPattern?: string;    // Regex or substring match on file path
  priority?: RequirementPriority; // Explicit priority for requirement entities (CRITICAL, HIGH, MEDIUM, LOW)
}

export interface ArchitectureRule {
  id: string;
  name: string;
  description: string;
  kind: RuleKind;
  severity: RuleSeverity;
  enabled: boolean;
  source: RuleSelector;
  target?: RuleSelector;
  forbiddenRelationships?: GraphRelationshipType[]; // Default: ["CALLS", "IMPORTS", "DEPENDS_ON", "EXTENDS"]
  requiredRelationship?: GraphRelationshipType;     // e.g. "VERIFIES", "REALIZES"
  direction?: RuleDirection;                        // Direction of requiredRelationship (default derived from relationship type)
  isCustom?: boolean;
}

export type FindingStatus = "VIOLATION" | "PASSED" | "INSUFFICIENT_EVIDENCE";

export interface FindingEvidence {
  sourceEntityId: string;
  sourceEntityName: string;
  sourceEntityType: EntityType;
  targetEntityId?: string;
  targetEntityName?: string;
  targetEntityType?: EntityType;
  relationship?: GraphRelationshipType;
  edgeId?: string;
  confidence?: number;
}

export interface RuleFinding {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: RuleSeverity;
  status: FindingStatus;
  message: string;
  evidence: FindingEvidence[];
  remediationAdvice?: string;
  isHeuristicEvidence?: boolean;
  evaluatedEntityCount?: number;
}

export interface ValidationSummary {
  totalRulesEvaluated: number;
  violationsCount: number;
  passedCount: number;
  insufficientEvidenceCount: number;
  bySeverity: {
    ERROR: number;
    WARNING: number;
    INFO: number;
  };
  findings: RuleFinding[];
}

export const DEFAULT_ARCHITECTURE_RULES: ArchitectureRule[] = [
  {
    id: "rule-no-ui-to-db",
    name: "Presentation Layer Must Not Directly Access Database Modules",
    description: "UI and client components must not import or invoke database/storage modules directly. Communication must flow through domain services.",
    kind: "FORBIDDEN_DEPENDENCY",
    severity: "ERROR",
    enabled: true,
    source: { entityType: "component" },
    target: { entityType: "module", filePathPattern: "db|database|repository|store|sql" },
    forbiddenRelationships: ["CALLS", "IMPORTS", "DEPENDS_ON"],
  },
  {
    id: "rule-critical-req-verifies",
    name: "Critical Requirements Require Verification Evidence",
    description: "Requirements marked with CRITICAL priority must have explicit test verification (VERIFIES edge from a test artifact).",
    kind: "REQUIRED_RELATIONSHIP",
    severity: "ERROR",
    enabled: true,
    source: { entityType: "requirement", priority: "CRITICAL" },
    target: { entityType: "test" },
    requiredRelationship: "VERIFIES",
    direction: "TARGET_TO_SOURCE",
  },
  {
    id: "rule-no-downward-coupling",
    name: "Lower-Level Modules Must Not Call Architecture Layer Containers",
    description: "Leaf modules or functions must not import or depend on top-level architecture components, preventing inverted dependency cycles.",
    kind: "FORBIDDEN_DEPENDENCY",
    severity: "WARNING",
    enabled: true,
    source: { entityType: "module" },
    target: { entityType: "architecture" },
    forbiddenRelationships: ["CALLS", "IMPORTS", "DEPENDS_ON"],
  },
  {
    id: "rule-unlinked-module-realization",
    name: "Code Modules Should Realize Architectural Components",
    description: "Production modules should trace to at least one architectural component or system boundary via REALIZES.",
    kind: "REQUIRED_RELATIONSHIP",
    severity: "WARNING",
    enabled: true,
    source: { entityType: "module" },
    target: { entityType: "architecture" },
    requiredRelationship: "REALIZES",
    direction: "SOURCE_TO_TARGET",
  },
];
