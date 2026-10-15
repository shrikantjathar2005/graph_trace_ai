import { AnyTraceEntity, EntityType } from "./entities";

export type ImpactRiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface AffectedEntityItem {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  filePath?: string;
  hopDistance: number; // 1 = directly connected, 2 = 2-hops away, etc.
  riskLevel: ImpactRiskLevel;
  impactReason: string; // e.g. "Direct method call from UserCheckoutController"
  isTestBroken: boolean;
}

export interface ImpactAnalysisResult {
  targetEntity: AnyTraceEntity;
  changeType: "MODIFY_SIGNATURE" | "CHANGE_LOGIC" | "DEPRECATE" | "DELETE";
  overallRisk: ImpactRiskLevel;
  riskScore: number; // 0 - 100
  directAffectedCount: number;
  indirectAffectedCount: number;
  affectededTestCount: number;
  affectedRequirementsCount: number;
  affectedDocsCount: number;
  affectedItems: AffectedEntityItem[];
  suggestedTestSuites: string[];
  suggestedDocsToUpdate: string[];
}
