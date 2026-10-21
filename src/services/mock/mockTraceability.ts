import { TraceabilityMatrixRow, TraceabilitySummaryStats } from "@/types/traceability";
import { mockGraphNodes } from "./mockGraphData";
import {
  ArchitectureEntity,
  ComponentEntity,
  ModuleEntity,
  ClassEntity,
  MethodEntity,
  TestEntity,
  DocumentationEntity,
} from "@/types/entities";

const getEntity = <T>(id: string): T => {
  const node = mockGraphNodes.find((n) => n.id === id);
  if (!node) throw new Error(`Entity not found in mockGraphNodes: ${id}`);
  return node.entity as unknown as T;
};

export const mockTraceabilityRows: TraceabilityMatrixRow[] = [
  // 1. REQ-001: User Login (Functional, FULL)
  {
    requirement: {
      id: "REQ-001",
      name: "User Login & JWT Session Management",
      type: "requirement",
      reqCode: "REQ-001",
      category: "FUNCTIONAL",
      priority: "HIGH",
      status: "APPROVED",
      sourceDocument: "SRS-Section-3.2-Auth",
      description:
        "Users must be authenticated via asymmetric JWT bearer tokens. Sessions expire in 15 minutes with token rotation support.",
      acceptanceCriteria: [
        "JWT tokens must expire within 15 minutes",
        "Refresh token rotation must invalidate prior token chains",
        "Signatures must verify against public keys",
      ],
    },
    architectureNodes: [getEntity<ArchitectureEntity>("ARCH-API-GATEWAY")],
    components: [getEntity<ComponentEntity>("COMP-AUTH-MIDDLEWARE")],
    modules: [getEntity<ModuleEntity>("MOD-AUTH-SERVICE")],
    classes: [getEntity<ClassEntity>("CLS-SESSION-VALIDATOR")],
    methods: [getEntity<MethodEntity>("MTH-VERIFY-JWT")],
    tests: [getEntity<TestEntity>("TST-AUTH-JWT-VALIDATION")],
    documents: [getEntity<DocumentationEntity>("DOC-SRS-AUTH")],
    coverageStatus: "FULL",
    coverageScore: 100,
    verificationSummary: {
      totalTests: 1,
      passedTests: 1,
      failedTests: 0,
    },
  },

  // 2. REQ-002: Payment Processing (Functional, PARTIAL - missing automated test)
  {
    requirement: {
      id: "REQ-002",
      name: "Payment Processing & Idempotency",
      type: "requirement",
      reqCode: "REQ-002",
      category: "FUNCTIONAL",
      priority: "CRITICAL",
      status: "APPROVED",
      sourceDocument: "SRS-Section-4.1-Payments",
      description:
        "Execute distributed credit card transactions with idempotent key locks preventing duplicate card charges.",
      acceptanceCriteria: [
        "Duplicate payment requests with identical idempotency-key must return cached receipt",
        "Failed external payment gateways must trigger exponential backoff retry",
      ],
    },
    architectureNodes: [getEntity<ArchitectureEntity>("ARCH-PAYMENT-SUBSYSTEM")],
    components: [getEntity<ComponentEntity>("COMP-PAYMENT-EXECUTOR")],
    modules: [getEntity<ModuleEntity>("MOD-PAYMENT-GATEWAY")],
    classes: [getEntity<ClassEntity>("CLS-PAYMENT-PROCESSOR")],
    methods: [getEntity<MethodEntity>("MTH-EXECUTE-PAYMENT")],
    tests: [], // TEST MISSING!
    documents: [
      getEntity<DocumentationEntity>("DOC-ADR-PAYMENT"),
      getEntity<DocumentationEntity>("DOC-API-SPEC"),
    ],
    coverageStatus: "PARTIAL",
    coverageScore: 65,
    verificationSummary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    },
    missingLinks: [
      {
        tier: "test",
        message: "TEST COVERAGE MISSING — No test suite linked to verify processTransaction idempotency",
      },
    ],
  },

  // 3. REQ-003: Password Security (Non-Functional, UNTESTED - planned architecture, missing code/tests)
  {
    requirement: {
      id: "REQ-003",
      name: "Password Security & Rate Limiting",
      type: "requirement",
      reqCode: "REQ-003",
      category: "SECURITY",
      priority: "HIGH",
      status: "APPROVED",
      sourceDocument: "SRS-Section-3.5-Security",
      description:
        "Enforce Argon2id hashing algorithms for credentials and DDoS rate limiting on /auth endpoints.",
      acceptanceCriteria: [
        "Argon2id parameter memory cost >= 64MB",
        "Rate limit to 5 failed attempts per IP per 10 minutes",
      ],
    },
    architectureNodes: [getEntity<ArchitectureEntity>("ARCH-API-GATEWAY")],
    components: [], // MISSING
    modules: [],    // MISSING
    classes: [],    // MISSING
    methods: [],    // MISSING
    tests: [],      // MISSING
    documents: [getEntity<DocumentationEntity>("DOC-SRS-AUTH")],
    coverageStatus: "UNTESTED",
    coverageScore: 15,
    verificationSummary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    },
    missingLinks: [
      {
        tier: "component",
        message: "COMPONENT MISSING — Architectural specification has no registered component",
      },
      {
        tier: "method",
        message: "CODE IMPLEMENTATION MISSING — No AST method handles password hashing logic",
      },
      {
        tier: "test",
        message: "TEST COVERAGE MISSING — 0 security unit or integration tests registered",
      },
    ],
  },

  // 4. REQ-004: Immutable Audit Trail (Non-Functional, FULL)
  {
    requirement: {
      id: "REQ-004",
      name: "Immutable Audit Trail & Compliance",
      type: "requirement",
      reqCode: "REQ-004",
      category: "COMPLIANCE",
      priority: "HIGH",
      status: "APPROVED",
      sourceDocument: "SRS-Section-6.0-Compliance",
      description:
        "Persist immutable HMAC-signed event records for financial regulatory compliance (SOC2 / PCI-DSS).",
      acceptanceCriteria: [
        "Audit logs must be cryptographically signed with HMAC-SHA256",
        "Event stream published to Kafka within 200ms of transaction",
      ],
    },
    architectureNodes: [getEntity<ArchitectureEntity>("ARCH-AUDIT-ENGINE")],
    components: [getEntity<ComponentEntity>("COMP-AUDIT-LOGGER")],
    modules: [getEntity<ModuleEntity>("MOD-AUDIT-WRITER")],
    classes: [],
    methods: [getEntity<MethodEntity>("MTH-DISPATCH-AUDIT")],
    tests: [getEntity<TestEntity>("TST-AUDIT-INTEGRITY")],
    documents: [getEntity<DocumentationEntity>("DOC-API-SPEC")],
    coverageStatus: "FULL",
    coverageScore: 100,
    verificationSummary: {
      totalTests: 1,
      passedTests: 1,
      failedTests: 0,
    },
  },
];

// Deterministic calculation: 2 FULL out of 4 total = 50.0%
export const mockTraceabilitySummary: TraceabilitySummaryStats = {
  totalRequirements: mockTraceabilityRows.length,
  fullyCovered: mockTraceabilityRows.filter((r) => r.coverageStatus === "FULL").length,
  partiallyCovered: mockTraceabilityRows.filter((r) => r.coverageStatus === "PARTIAL").length,
  untested: mockTraceabilityRows.filter((r) => r.coverageStatus === "UNTESTED").length,
  coveragePercent:
    Math.round(
      (mockTraceabilityRows.filter((r) => r.coverageStatus === "FULL").length /
        mockTraceabilityRows.length) *
        1000
    ) / 10,
  totalTestsMapped: mockTraceabilityRows.reduce((acc, r) => acc + r.tests.length, 0),
  overallCoveragePercent:
    Math.round(
      (mockTraceabilityRows.filter((r) => r.coverageStatus === "FULL").length /
        mockTraceabilityRows.length) *
        1000
    ) / 10,
  fullyTraced: mockTraceabilityRows.filter((r) => r.coverageStatus === "FULL").length,
};
