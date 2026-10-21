/**
 * Core Domain Entities for GraphTrace AI
 * Represents the 8-tier traceability hierarchy:
 * Requirement -> Architecture -> Component -> Module -> Class -> Method -> Test -> Documentation
 */

export type EntityType =
  | "requirement"
  | "architecture"
  | "component"
  | "module"
  | "class"
  | "method"
  | "test"
  | "documentation";

export interface BaseEntity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  filePath?: string;
  metadata?: Record<string, unknown>;
}

export type RequirementPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RequirementStatus = "APPROVED" | "IN_REVIEW" | "DRAFT" | "DEPRECATED";

export interface RequirementEntity extends BaseEntity {
  type: "requirement";
  reqCode: string; // e.g. "REQ-SEC-001"
  category: "FUNCTIONAL" | "SECURITY" | "PERFORMANCE" | "COMPLIANCE";
  priority: RequirementPriority;
  status: RequirementStatus;
  acceptanceCriteria?: string[];
  sourceDocument?: string; // SRS, PRD, RFC
}

export interface ArchitectureEntity extends BaseEntity {
  type: "architecture";
  archCode: string; // e.g. "ARCH-GATEWAY"
  layer: "PRESENTATION" | "APPLICATION" | "DOMAIN" | "INFRASTRUCTURE" | "PERSISTENCE";
  pattern: "MICROSERVICE" | "EVENT_DRIVEN" | "LAYERED" | "GATEWAY";
  technologies?: string[];
}

export interface ComponentEntity extends BaseEntity {
  type: "component";
  packageName: string;
  subsystem: string;
  responsibilities?: string[];
}

export interface ModuleEntity extends BaseEntity {
  type: "module";
  filePath: string;
  language: "TypeScript" | "JavaScript" | "Python" | "Java" | "Go" | "Rust";
  loc: number;
  imports?: string[];
}

export interface ClassEntity extends BaseEntity {
  type: "class";
  filePath: string;
  startLine: number;
  endLine: number;
  isAbstract?: boolean;
  implementsInterfaces?: string[];
  superClass?: string;
  methodsCount: number;
}

export interface MethodEntity extends BaseEntity {
  type: "method";
  filePath: string;
  startLine: number;
  endLine: number;
  signature: string; // e.g. "validateSession(token: string): Promise<UserSession>"
  returnType: string;
  parameters: Array<{ name: string; type: string }>;
  visibility: "public" | "protected" | "private";
  complexityScore?: number;
}

export type TestType = "UNIT" | "INTEGRATION" | "E2E" | "REGRESSION";

export interface TestEntity extends BaseEntity {
  type: "test";
  testType: TestType;
  filePath: string;
  testSuite: string;
  framework: "Jest" | "Pytest" | "JUnit" | "Mocha";
  lastRunStatus: "PASSED" | "FAILED" | "SKIPPED";
  durationMs: number;
}

export type DocumentationType = "SRS" | "API_SPEC" | "README" | "ADR" | "USER_MANUAL";

export interface DocumentationEntity extends BaseEntity {
  type: "documentation";
  docType: DocumentationType;
  filePath: string;
  section: string;
  author?: string;
  lastUpdated?: string;
}

export type AnyTraceEntity =
  | RequirementEntity
  | ArchitectureEntity
  | ComponentEntity
  | ModuleEntity
  | ClassEntity
  | MethodEntity
  | TestEntity
  | DocumentationEntity;
