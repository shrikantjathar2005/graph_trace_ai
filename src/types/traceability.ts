import {
  RequirementEntity,
  ArchitectureEntity,
  ComponentEntity,
  ModuleEntity,
  ClassEntity,
  MethodEntity,
  TestEntity,
  DocumentationEntity,
  EntityType,
  AnyTraceEntity,
} from "./entities";

export type CoverageStatus = "FULL" | "PARTIAL" | "UNTESTED";

export interface TraceabilityChainTier {
  tier: EntityType;
  label: string;
  isLinked: boolean;
  missingReason?: string;
  items: AnyTraceEntity[];
}

export interface TraceabilityMatrixRow {
  requirement: RequirementEntity;
  architectureNodes: ArchitectureEntity[];
  components: ComponentEntity[];
  modules: ModuleEntity[];
  classes: ClassEntity[];
  methods: MethodEntity[];
  tests: TestEntity[];
  documents: DocumentationEntity[];
  coverageStatus: CoverageStatus;
  coverageScore: number; // 0 to 100%
  verificationSummary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
  missingLinks?: {
    tier: EntityType;
    message: string;
  }[];
}

export interface TraceabilitySummaryStats {
  totalRequirements: number;
  fullyCovered: number;
  partiallyCovered: number;
  untested: number;
  coveragePercent: number; // strictly: (fullyCovered / totalRequirements) * 100
  totalTestsMapped: number;
  overallCoveragePercent: number; // alias
  fullyTraced: number; // alias
}
