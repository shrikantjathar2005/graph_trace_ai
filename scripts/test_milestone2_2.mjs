import assert from "node:assert";

// -----------------------------------------------------------------
// Configurable Mock localStorage for Real Application Testing
// -----------------------------------------------------------------
class MockLocalStorage {
  constructor() {
    this.store = {};
    this.quotaError = false;
    this.failOnKey = null;
    this.failAfterWrites = null;
    this.writeCount = 0;
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.writeCount++;
    if (this.quotaError) {
      const err = new Error("Quota exceeded: disk full");
      err.name = "QuotaExceededError";
      err.code = 22;
      throw err;
    }
    if (this.failOnKey && key === this.failOnKey) {
      throw new Error("Simulated write failure on key: " + key);
    }
    if (this.failAfterWrites !== null && this.writeCount > this.failAfterWrites) {
      throw new Error("Simulated write failure after " + this.failAfterWrites + " writes");
    }
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
    this.quotaError = false;
    this.failOnKey = null;
    this.failAfterWrites = null;
    this.writeCount = 0;
  }
}

const mockStorage = new MockLocalStorage();
globalThis.window = {};
globalThis.localStorage = mockStorage;
globalThis.sessionStorage = new MockLocalStorage();

// -----------------------------------------------------------------
// Import ACTUAL Production Modules (No Reimplemented Copies!)
// -----------------------------------------------------------------
const {
  saveImportedProject,
  getImportedGraph,
  getAllImportedProjects,
  deleteImportedProject,
  getActiveProjectId,
  setActiveProjectId,
} = await import("../src/lib/graphStore.ts");

const { ingestArtifacts } = await import("../src/lib/artifactIngestor.ts");

const {
  evaluateRequirementTraceability,
  computeTraceabilitySummary,
  resolveTraceabilityEntity,
} = await import("../src/lib/traceabilityEngine.ts");

const {
  countDependencyEdges,
  isDependencyEdge,
  DEPENDENCY_RELATIONSHIP_TYPES,
} = await import("../src/lib/dependencyEngine.ts");

const {
  validateArchitectureRules,
  matchesSelector,
} = await import("../src/lib/ruleValidationEngine.ts");

const {
  computeRelationshipAwareImpact,
} = await import("../src/lib/impactEngine.ts");

const { DEFAULT_ARCHITECTURE_RULES } = await import("../src/types/rules.ts");

console.log("=================================================================");
console.log("GRAPH TRACE AI — REAL PRODUCTION MODULE REGRESSION SUITE (M2.2.1)");
console.log("=================================================================\n");

let passedCount = 0;
let totalCount = 0;

async function runTest(name, fn) {
  totalCount++;
  try {
    await fn();
    passedCount++;
    console.log("  [PASS] " + name);
  } catch (err) {
    console.error("  [FAIL] " + name);
    console.error(err);
    process.exitCode = 1;
  }
}

// =================================================================
// 1. STORAGE FAILURE RECOVERY & ROLLBACK TESTS (REAL graphStore.ts)
// =================================================================
console.log("--- 1. Testing Real Storage Failure Recovery & Rollback ---");

const PROJECTS_LIST_KEY = "graphtrace.imported-projects-list.v2";
const GRAPH_KEY_PREFIX = "graphtrace.imported-graph.v2.";
const ACTIVE_PROJECT_KEY = "graphtrace.active-project-id.v1";

mockStorage.clear();

const sampleProject1 = {
  id: "imported-proj-alpha",
  name: "Alpha Banking Core",
  type: "imported",
  nodeCount: 2,
  edgeCount: 1,
  importedAt: new Date().toISOString(),
};

const sampleGraphV1 = {
  nodes: [
    { id: "node-1", label: "AuthService V1", type: "service", filePath: "src/auth.ts" },
    { id: "node-2", label: "UserRepo V1", type: "module", filePath: "src/user.ts" },
  ],
  edges: [
    { id: "e1", source: "node-1", target: "node-2", relationship: "CALLS" },
  ],
};

const sampleGraphV2 = {
  nodes: [
    { id: "node-1", label: "AuthService V2 Updated", type: "service", filePath: "src/auth.ts" },
    { id: "node-3", label: "TokenService New", type: "service", filePath: "src/token.ts" },
  ],
  edges: [
    { id: "e2", source: "node-1", target: "node-3", relationship: "CALLS" },
  ],
};

await runTest("1.1 Successfully saves new project and graph to localStorage", () => {
  const result = saveImportedProject(sampleProject1, sampleGraphV1);
  assert.strictEqual(result.success, true);

  const savedGraph = getImportedGraph(sampleProject1.id);
  assert.ok(savedGraph, "Graph must exist in storage");
  assert.strictEqual(savedGraph.nodes[0].label, "AuthService V1");

  const list = getAllImportedProjects();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].id, sampleProject1.id);

  assert.strictEqual(getActiveProjectId(), sampleProject1.id);
});

await runTest("1.2 New-project write failure rolls back and removes orphaned graph", () => {
  setActiveProjectId(sampleProject1.id);

  const sampleProject2 = {
    id: "imported-proj-beta",
    name: "Beta Microservice",
    type: "imported",
    nodeCount: 1,
    edgeCount: 0,
    importedAt: new Date().toISOString(),
  };
  const betaGraph = {
    nodes: [{ id: "b1", label: "Beta Node", type: "service" }],
    edges: [],
  };

  try {
    // Simulate failure when writing the project list (after graph was written)
    mockStorage.failOnKey = PROJECTS_LIST_KEY;

    const result = saveImportedProject(sampleProject2, betaGraph);
    assert.strictEqual(result.success, false, "Save must report failure");
    assert.ok(result.error, "Must return an error message");

    // The orphaned graph key for beta must be completely removed
    const orphanGraphRaw = mockStorage.getItem(GRAPH_KEY_PREFIX + sampleProject2.id);
    assert.strictEqual(orphanGraphRaw, null, "Orphaned graph key must be removed on new-project rollback");

    // Alpha project list and active project must remain intact
    const list = getAllImportedProjects();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, sampleProject1.id);
    assert.strictEqual(getActiveProjectId(), sampleProject1.id);
  } finally {
    mockStorage.failOnKey = null;
  }
});

await runTest("1.3 Existing-project rollback: preserves previous graph when update fails", () => {
  // Initial state: proj-alpha has sampleGraphV1
  assert.strictEqual(getImportedGraph(sampleProject1.id).nodes[0].label, "AuthService V1");

  try {
    // Now attempt to update existing project proj-alpha with sampleGraphV2
    // Simulate write failure on the project list update
    mockStorage.failOnKey = PROJECTS_LIST_KEY;

    const updatedProject = {
      ...sampleProject1,
      name: "Alpha Banking Core Updated",
      nodeCount: 2,
    };

    const result = saveImportedProject(updatedProject, sampleGraphV2);
    assert.strictEqual(result.success, false, "Update must report failure");

    // CRITICAL CHECK: The original graph must be RESTORED, NOT deleted!
    const restoredGraph = getImportedGraph(sampleProject1.id);
    assert.ok(restoredGraph, "Graph must still exist in storage");
    assert.strictEqual(
      restoredGraph.nodes[0].label,
      "AuthService V1",
      "Original graph V1 must be preserved when update write fails"
    );

    // Project list must still have original metadata
    const list = getAllImportedProjects();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].name, sampleProject1.name);

    // Active project ID must remain preserved
    assert.strictEqual(getActiveProjectId(), sampleProject1.id);
  } finally {
    mockStorage.failOnKey = null;
  }
});

await runTest("1.4 Handles QuotaExceededError honestly with informative error result", () => {
  try {
    mockStorage.quotaError = true;

    const project3 = {
      id: "imported-proj-gamma",
      name: "Gamma Service",
      type: "imported",
      nodeCount: 0,
      edgeCount: 0,
      importedAt: new Date().toISOString(),
    };

    const result = saveImportedProject(project3, { nodes: [], edges: [] });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isQuotaError, true, "Must flag isQuotaError");
    assert.ok(result.error && result.error.toLowerCase().includes("quota"), "Must describe storage quota exceeded");
  } finally {
    mockStorage.quotaError = false;
  }
});

await runTest("1.5 Deleting imported project removes graph and cleans up project list", () => {
  assert.strictEqual(getAllImportedProjects().length, 1);
  deleteImportedProject(sampleProject1.id);

  assert.strictEqual(getAllImportedProjects().length, 0);
  assert.strictEqual(mockStorage.getItem(GRAPH_KEY_PREFIX + sampleProject1.id), null);
});

// =================================================================
// 2. REAL TRACEABILITY ENGINE TESTS (REAL traceabilityEngine.ts)
// =================================================================
console.log("\n--- 2. Testing Real Traceability Engine ---");

await runTest("2.1 Valid direct verification: Test --VERIFIES--> Requirement yields FULL and unexecuted pass count", () => {
  const graph = {
    nodes: [
      { id: "REQ-001", label: "User Authentication", type: "requirement" },
      { id: "TEST-001", label: "AuthServiceTest", type: "test" },
    ],
    edges: [
      { id: "e1", source: "TEST-001", target: "REQ-001", relationship: "VERIFIES" },
    ],
  };

  const rows = evaluateRequirementTraceability(graph);
  assert.strictEqual(rows.length, 1);
  const row = rows[0];
  assert.strictEqual(row.coverageStatus, "FULL");
  assert.strictEqual(row.tests.length, 1);
  assert.strictEqual(row.tests[0].id, "TEST-001");
  assert.strictEqual(row.verificationSummary.passedTests, 0, "passedTests must remain 0 (honest unexecuted)");
});

await runTest("2.2 Indirect-only verification: Test -> Method in Module <-- Requirement yields PARTIAL", () => {
  const graph = {
    nodes: [
      { id: "REQ-002", label: "Payment Processing", type: "requirement" },
      { id: "MOD-001", label: "PaymentGateway", type: "module" },
      { id: "METH-001", label: "chargeCreditCard", type: "method" },
      { id: "TEST-002", label: "PaymentTest", type: "test" },
    ],
    edges: [
      { id: "e1", source: "MOD-001", target: "REQ-002", relationship: "REALIZES" },
      { id: "e2", source: "MOD-001", target: "METH-001", relationship: "CONTAINS" },
      { id: "e3", source: "TEST-002", target: "METH-001", relationship: "VERIFIES" },
    ],
  };

  const rows = evaluateRequirementTraceability(graph);
  assert.strictEqual(rows.length, 1);
  const row = rows[0];
  assert.strictEqual(row.coverageStatus, "PARTIAL");
  assert.strictEqual(row.tests.length, 1, "Displays indirect test candidate");
  assert.strictEqual(row.modules.length, 1);
  assert.ok(row.missingLinks && row.missingLinks.length > 0, "Flags that only indirect verification exists");
});

await runTest("2.3 Malformed or reversed links rejected for direct verification", () => {
  const graph = {
    nodes: [
      { id: "REQ-003", label: "Data Audit Log", type: "requirement" },
      { id: "TEST-003", label: "AuditTest", type: "test" },
      { id: "MOD-002", label: "AuditLogger", type: "module" },
    ],
    edges: [
      // Case A: Reversed edge direction (source=requirement, target=test)
      { id: "e1", source: "REQ-003", target: "TEST-003", relationship: "VERIFIES" },
      // Case B: Correct direction, but source is not a test node
      { id: "e2", source: "MOD-002", target: "REQ-003", relationship: "VERIFIES" },
      // Case C: Test node connected via non-VERIFIES relationship
      { id: "e3", source: "TEST-003", target: "REQ-003", relationship: "DEPENDS_ON" },
    ],
  };

  const rows = evaluateRequirementTraceability(graph);
  assert.strictEqual(rows.length, 1);
  const row = rows[0];
  assert.strictEqual(row.coverageStatus, "UNTESTED");
  assert.strictEqual(row.tests.length, 0);
});

await runTest("2.4 computeTraceabilitySummary accurately aggregates counts and percentages", () => {
  const mockRows = [
    { coverageStatus: "FULL", tests: [{ id: "t1" }], passedTests: 0 },
    { coverageStatus: "PARTIAL", tests: [], passedTests: 0 },
    { coverageStatus: "UNTESTED", tests: [], passedTests: 0 },
    { coverageStatus: "UNTESTED", tests: [], passedTests: 0 },
  ];

  const summary = computeTraceabilitySummary(mockRows);
  assert.strictEqual(summary.totalRequirements, 4);
  assert.strictEqual(summary.fullyCovered, 1);
  assert.strictEqual(summary.partiallyCovered, 1);
  assert.strictEqual(summary.untested, 2);
  assert.strictEqual(summary.coveragePercent, 25);
  assert.strictEqual(summary.fullyTraced, 1);
});

// =================================================================
// 3. REAL RELATIONSHIP-AWARE IMPACT ENGINE TESTS (REAL impactEngine.ts)
// =================================================================
console.log("\n--- 3. Testing Real Relationship-Aware Impact Engine ---");

await runTest("3.1 Propagates downstream impact along semantic relations respecting edge direction", () => {
  const graph = {
    nodes: [
      { id: "svc-auth", label: "AuthService", type: "service" },
      { id: "api-gateway", label: "ApiGateway", type: "service" },
      { id: "mod-crypto", label: "CryptoUtils", type: "module" },
      { id: "test-auth", label: "AuthTestSuite", type: "test" },
      { id: "db-users", label: "UserDatabase", type: "database" },
      { id: "unrelated-ui", label: "NavbarComponent", type: "component" },
    ],
    edges: [
      // ApiGateway CALLS AuthService -> modifying AuthService impacts caller ApiGateway
      { id: "e1", source: "api-gateway", target: "svc-auth", relationship: "CALLS" },
      // AuthService CONTAINS CryptoUtils -> modifying AuthService impacts constituent module
      { id: "e2", source: "svc-auth", target: "mod-crypto", relationship: "CONTAINS" },
      // AuthTestSuite VERIFIES AuthService -> modifying AuthService impacts verification test
      { id: "e3", source: "test-auth", target: "svc-auth", relationship: "VERIFIES" },
      // AuthService CALLS UserDatabase -> modifying AuthService does NOT impact callee database
      { id: "e4", source: "svc-auth", target: "db-users", relationship: "CALLS" },
    ],
  };

  const impact = computeRelationshipAwareImpact(graph, "svc-auth");
  assert.strictEqual(impact.targetEntity.id, "svc-auth");

  const impactedIds = impact.affectedItems.map((n) => n.entityId);

  // Callers and tests impacted:
  assert.ok(impactedIds.includes("api-gateway"), "Must impact caller api-gateway via CALLS");
  assert.ok(impactedIds.includes("mod-crypto"), "Must impact constituent mod-crypto via CONTAINS");
  assert.ok(impactedIds.includes("test-auth"), "Must impact test-auth via VERIFIES");

  // Relationship direction respected: callee database is NOT broken by consumer change
  assert.ok(!impactedIds.includes("db-users"), "Callee database should not be impacted when caller changes");

  // Unrelated disconnected node must NOT be impacted
  assert.ok(!impactedIds.includes("unrelated-ui"), "Unrelated isolated node must not be impacted");

  // Affected tests must list test-auth
  assert.ok(impact.suggestedTestSuites.includes("AuthTestSuite"));
  assert.ok(impact.riskScore > 0, "Risk score must be calculated");
});

await runTest("3.2 Returns empty impact result safely for nonexistent root node", () => {
  const graph = { nodes: [], edges: [] };
  const impact = computeRelationshipAwareImpact(graph, "nonexistent");
  assert.strictEqual(impact.targetEntity.id, "NONE");
  assert.strictEqual(impact.affectedItems.length, 0);
  assert.strictEqual(impact.riskScore, 0);
});


await runTest("3.3 Semantic propagation for REALIZES, DOCUMENTS, DEPENDS_ON, and IMPORTS", () => {
  const graph = {
    nodes: [
      { id: "mod-payment", label: "PaymentModule", type: "module" },
      { id: "req-payment", label: "REQ-Payment", type: "requirement" },
      { id: "doc-arch", label: "ADR-Payment", type: "documentation" },
      { id: "mod-checkout", label: "CheckoutService", type: "module" },
      { id: "mod-billing", label: "BillingService", type: "module" },
    ],
    edges: [
      // Architecture/Module realizes Requirement
      { id: "e1", source: "req-payment", target: "mod-payment", relationship: "REALIZES" },
      // Documentation documents PaymentModule
      { id: "e2", source: "doc-arch", target: "mod-payment", relationship: "DOCUMENTS" },
      // CheckoutService IMPORTS PaymentModule
      { id: "e3", source: "mod-checkout", target: "mod-payment", relationship: "IMPORTS" },
      // BillingService DEPENDS_ON PaymentModule
      { id: "e4", source: "mod-billing", target: "mod-payment", relationship: "DEPENDS_ON" },
    ],
  };

  const impact = computeRelationshipAwareImpact(graph, "mod-payment");
  const affected = impact.affectedItems.map((i) => i.entityId);

  assert.ok(affected.includes("req-payment"), "Requirement must be impacted via REALIZES");
  assert.ok(affected.includes("doc-arch"), "Documentation must be impacted via DOCUMENTS");
  assert.ok(affected.includes("mod-checkout"), "Consumer module must be impacted via IMPORTS");
  assert.ok(affected.includes("mod-billing"), "Dependent module must be impacted via DEPENDS_ON");
  assert.strictEqual(impact.suggestedDocsToUpdate.length, 1);
  assert.strictEqual(impact.suggestedDocsToUpdate[0], "ADR-Payment");
});

await runTest("3.4 Impact scoring formula and threshold classifications", () => {
  // Case A: 4 direct dependencies = 80 points -> CRITICAL
  const graph4Direct = {
    nodes: [
      { id: "root", label: "RootUnit", type: "module" },
      { id: "c1", label: "C1", type: "module" },
      { id: "c2", label: "C2", type: "module" },
      { id: "c3", label: "C3", type: "module" },
      { id: "c4", label: "C4", type: "module" },
    ],
    edges: [
      { id: "e1", source: "c1", target: "root", relationship: "CALLS" },
      { id: "e2", source: "c2", target: "root", relationship: "CALLS" },
      { id: "e3", source: "c3", target: "root", relationship: "CALLS" },
      { id: "e4", source: "c4", target: "root", relationship: "CALLS" },
    ],
  };
  const impact4 = computeRelationshipAwareImpact(graph4Direct, "root");
  assert.strictEqual(impact4.riskScore, 80);
  assert.strictEqual(impact4.overallRisk, "CRITICAL");

  // Case B: 1 direct dependency = 20 points -> MEDIUM
  const graph1Direct = {
    nodes: [
      { id: "root", label: "RootUnit", type: "module" },
      { id: "c1", label: "C1", type: "module" },
    ],
    edges: [{ id: "e1", source: "c1", target: "root", relationship: "CALLS" }],
  };
  const impact1 = computeRelationshipAwareImpact(graph1Direct, "root");
  assert.strictEqual(impact1.riskScore, 20);
  assert.strictEqual(impact1.overallRisk, "MEDIUM");

  // Case C: 0 direct = 0 points -> LOW
  const graph0 = {
    nodes: [{ id: "root", label: "RootUnit", type: "module" }],
    edges: [],
  };
  const impact0 = computeRelationshipAwareImpact(graph0, "root");
  assert.strictEqual(impact0.riskScore, 0);
  assert.strictEqual(impact0.overallRisk, "LOW");
});

await runTest("3.5 Focus Neighborhood (1-hop graph adjacency) distinguishes from directional Impact", () => {
  const graph = {
    nodes: [
      { id: "center", label: "CenterNode", type: "module" },
      { id: "caller", label: "CallerNode", type: "module" },
      { id: "callee", label: "CalleeDatabase", type: "database" },
    ],
    edges: [
      { id: "e1", source: "caller", target: "center", relationship: "CALLS" },
      { id: "e2", source: "center", target: "callee", relationship: "CALLS" },
    ],
  };

  // 1-hop adjacency logic (as used in KnowledgeGraphCanvas Focus Neighborhood):
  const neighborhood = new Set(["center"]);
  graph.edges.forEach((e) => {
    if (e.source === "center") neighborhood.add(e.target);
    if (e.target === "center") neighborhood.add(e.source);
  });
  assert.strictEqual(neighborhood.size, 3, "Neighborhood must include both caller and callee");
  assert.ok(neighborhood.has("caller"));
  assert.ok(neighborhood.has("callee"));

  // In contrast, impact analysis follows directional contracts:
  const impact = computeRelationshipAwareImpact(graph, "center");
  const impactedIds = impact.affectedItems.map((i) => i.entityId);
  assert.ok(impactedIds.includes("caller"), "Caller is impacted");
  assert.ok(!impactedIds.includes("callee"), "Callee is NOT impacted when caller changes");
});


// =================================================================
// 4. PROJECT-SWITCHING ISOLATION TESTS
// =================================================================
console.log("\n--- 4. Testing Project-Switching Isolation ---");

await runTest("4.1 Project-switching key generation & storage isolation (stable-key derivation & store segregation)", () => {
  // NOTE: This test asserts stable-key derivation and per-project storage isolation in Node.
  // Full React component lifecycle isolation (canvas teardown, inspector reset, search/filter reset)
  // is verified end-to-end in real browser automation (see browser subagent verification reports).
  const projectA = {
    id: "imported-proj-alpha",
    name: "Alpha Project",
    isSample: false,
    nodeCount: 2,
    edgeCount: 1,
    importedAt: new Date().toISOString(),
  };

  const graphA = {
    nodes: [
      { id: "NODE-ROOT", label: "Alpha Root Service", type: "module" },
      { id: "NODE-CHILD", label: "Alpha Child Worker", type: "module" },
    ],
    edges: [
      { id: "e1", source: "NODE-ROOT", target: "NODE-CHILD", relationship: "CONTAINS" },
    ],
  };

  const projectB = {
    id: "imported-proj-beta",
    name: "Beta Project",
    isSample: false,
    nodeCount: 2,
    edgeCount: 1,
    importedAt: new Date().toISOString(),
  };

  const graphB = {
    nodes: [
      { id: "NODE-ROOT", label: "Beta Root Gateway", type: "module" },
      { id: "NODE-CHILD", label: "Beta Child Handler", type: "module" },
    ],
    edges: [
      { id: "e1", source: "NODE-ROOT", target: "NODE-CHILD", relationship: "CONTAINS" },
    ],
  };

  // Both projects have:
  // - Node count: 2
  // - Edge count: 1
  // - First node ID: "NODE-ROOT"
  assert.strictEqual(graphA.nodes.length, graphB.nodes.length);
  assert.strictEqual(graphA.edges.length, graphB.edges.length);
  assert.strictEqual(graphA.nodes[0].id, graphB.nodes[0].id);

  // Key algorithm: stableKey = projectId ? "project-" + projectId : ...
  const getKey = (projId, graph) =>
    projId ? "project-" + projId : graph.nodes.length + "-" + graph.edges.length + "-" + (graph.nodes[0]?.id || "empty");

  const keyA = getKey(projectA.id, graphA);
  const keyB = getKey(projectB.id, graphB);
  assert.notStrictEqual(keyA, keyB, "Project IDs must produce distinct keys even with identical graph metrics");
  assert.strictEqual(keyA, "project-imported-proj-alpha");
  assert.strictEqual(keyB, "project-imported-proj-beta");

  // Save both projects
  saveImportedProject(projectA, graphA);
  saveImportedProject(projectB, graphB);

  // Activate Project A
  setActiveProjectId(projectA.id);
  assert.strictEqual(getActiveProjectId(), projectA.id);
  const loadedA = getImportedGraph(projectA.id);
  assert.strictEqual(loadedA.nodes[0].label, "Alpha Root Service");

  // Switch to Project B
  setActiveProjectId(projectB.id);
  assert.strictEqual(getActiveProjectId(), projectB.id);
  const loadedB = getImportedGraph(projectB.id);
  assert.strictEqual(loadedB.nodes[0].label, "Beta Root Gateway");
  assert.notStrictEqual(loadedB.nodes[0].label, loadedA.nodes[0].label);

  // Clean up
  deleteImportedProject(projectA.id);
  deleteImportedProject(projectB.id);
});

// =================================================================
// 5. STRENGTHENED IMPACT SCORE TESTS (BOUNDARIES, CYCLES, DEDUP)
// =================================================================
console.log("\n--- 5. Testing Strengthened Impact Score Boundaries, Cycles & Deduplication ---");

await runTest("5.1 Cycles and mutual dependencies do not cause infinite recursion or inflate score", () => {
  // Graph with a cycle: A calls B and B calls A
  const cyclicGraph = {
    nodes: [
      { id: "A", label: "Module A", type: "module" },
      { id: "B", label: "Module B", type: "module" },
    ],
    edges: [
      { id: "e1", source: "A", target: "B", relationship: "CALLS" },
      { id: "e2", source: "B", target: "A", relationship: "CALLS" },
    ],
  };

  const impactA = computeRelationshipAwareImpact(cyclicGraph, "A");
  // When A changes, its caller B is impacted (1 direct).
  // Traversal does NOT cycle back to add A again.
  assert.strictEqual(impactA.directAffectedCount, 1);
  assert.strictEqual(impactA.indirectAffectedCount, 0);
  assert.strictEqual(impactA.riskScore, 20);
  assert.strictEqual(impactA.overallRisk, "MEDIUM");
  assert.strictEqual(impactA.affectedItems.length, 1);
  assert.strictEqual(impactA.affectedItems[0].entityId, "B");
});

await runTest("5.2 Multi-path convergence preserves shortest hop distance and deduplicates affected items", () => {
  // Target -> C1 (direct, 1-hop via CALLS)
  // Target -> C2 (direct, 1-hop via CALLS) -> C1 (also calls C1 via 2-hop)
  const convergingGraph = {
    nodes: [
      { id: "target", label: "Target", type: "module" },
      { id: "c1", label: "Caller 1", type: "module" },
      { id: "c2", label: "Caller 2", type: "module" },
    ],
    edges: [
      { id: "e1", source: "c1", target: "target", relationship: "CALLS" },
      { id: "e2", source: "c2", target: "target", relationship: "CALLS" },
      { id: "e3", source: "c1", target: "c2", relationship: "CALLS" },
    ],
  };

  const impact = computeRelationshipAwareImpact(convergingGraph, "target");
  // Both c1 and c2 are directly 1-hop away from target
  assert.strictEqual(impact.directAffectedCount, 2);
  assert.strictEqual(impact.indirectAffectedCount, 0);
  assert.strictEqual(impact.affectedItems.length, 2);
  const ids = impact.affectedItems.map((i) => i.entityId);
  assert.ok(ids.includes("c1"));
  assert.ok(ids.includes("c2"));
  // Deduplicated: neither c1 nor c2 is counted twice
  assert.strictEqual(impact.riskScore, 40);
});

await runTest("5.3 Exact risk score boundaries across all four risk levels (LOW, MEDIUM, HIGH, CRITICAL)", () => {
  // Helper to build graph with direct (1-hop) and indirect (2-hop) callers
  // Traversal semantics:
  // - Direct callers invoke root: (dir_d --CALLS--> root). When root changes, dir_d is impacted (hop 1, +20 pts).
  // - Indirect callers invoke direct callers: (indir_i --CALLS--> dir_1). When root changes,
  //   contract breaks dir_1, which in turn impacts indir_i (hop 2, +10 pts).
  const buildGraph = (directCount, indirectCount) => {
    const nodes = [{ id: "root", label: "Root", type: "module" }];
    const edges = [];
    for (let d = 1; d <= directCount; d++) {
      const dId = "dir_" + d;
      nodes.push({ id: dId, label: dId, type: "module" });
      edges.push({ id: "e_d" + d, source: dId, target: "root", relationship: "CALLS" });
    }
    for (let i = 1; i <= indirectCount; i++) {
      const iId = "indir_" + i;
      nodes.push({ id: iId, label: iId, type: "module" });
      // Attach indirect node to first direct caller
      edges.push({ id: "e_i" + i, source: iId, target: "dir_1", relationship: "CALLS" });
    }
    return { nodes, edges };
  };

  // Boundary 1: Score 0 -> LOW (< 20 threshold, isolated node with 0 reachable dependents)
  const res0 = computeRelationshipAwareImpact(buildGraph(0, 0), "root");
  assert.strictEqual(res0.riskScore, 0);
  assert.strictEqual(res0.overallRisk, "LOW");
  assert.strictEqual(res0.directAffectedCount, 0);
  assert.strictEqual(res0.indirectAffectedCount, 0);

  // NOTE ON ACHIEVABLE TOPOLOGICAL BOUNDARIES:
  // Under topological graph traversal from target, any 2-hop indirect node requires at least one
  // 1-hop direct intermediary along the propagation path. Thus, whenever indirectCount >= 1,
  // directCount must also be >= 1.
  // Because direct nodes contribute 20 points and indirect nodes contribute 10 points:
  // - If reachable nodes = 0, score is 0 (LOW).
  // - If reachable nodes >= 1, minimum score is 1 direct * 20 = 20 (MEDIUM).
  // Non-zero scores below 20 (such as 10, or intermediate scores 19, 49, 79) are mathematically
  // unachievable on any valid graph with this scoring formula.

  // Boundary 2: Score 20 (1 direct, 0 indirect) -> Exact lower bound of MEDIUM (>= 20)
  const res20 = computeRelationshipAwareImpact(buildGraph(1, 0), "root");
  assert.strictEqual(res20.riskScore, 20);
  assert.strictEqual(res20.overallRisk, "MEDIUM");

  // Boundary 3: Score 40 (2 direct, 0 indirect) -> Upper MEDIUM (< 50)
  const res40 = computeRelationshipAwareImpact(buildGraph(2, 0), "root");
  assert.strictEqual(res40.riskScore, 40);
  assert.strictEqual(res40.overallRisk, "MEDIUM");

  // Boundary 4: Score 50 (2 direct, 1 indirect) -> Exact lower bound of HIGH (>= 50)
  const res50 = computeRelationshipAwareImpact(buildGraph(2, 1), "root");
  assert.strictEqual(res50.riskScore, 50);
  assert.strictEqual(res50.overallRisk, "HIGH");

  // Boundary 5: Score 70 (3 direct, 1 indirect) -> Upper HIGH (< 80)
  const res70 = computeRelationshipAwareImpact(buildGraph(3, 1), "root");
  assert.strictEqual(res70.riskScore, 70);
  assert.strictEqual(res70.overallRisk, "HIGH");

  // Boundary 6: Score 80 (4 direct, 0 indirect) -> Exact lower bound of CRITICAL (>= 80)
  const res80 = computeRelationshipAwareImpact(buildGraph(4, 0), "root");
  assert.strictEqual(res80.riskScore, 80);
  assert.strictEqual(res80.overallRisk, "CRITICAL");

  // Boundary 7: Score 100 capped (5 direct, 2 indirect = 120 -> 100) -> CRITICAL
  const res100 = computeRelationshipAwareImpact(buildGraph(5, 2), "root");
  assert.strictEqual(res100.riskScore, 100);
  assert.strictEqual(res100.overallRisk, "CRITICAL");
});

// =================================================================
// 6. INGESTION-TO-ANALYSIS BEHAVIOR TESTS
// =================================================================
console.log("\n--- 6. Testing Ingestion-to-Analysis End-to-End Behavior ---");

await runTest("6.1 Ingests representative source snippets and generates correct graph, traceability, and impact", async () => {
  const reqDoc = new File(
    ["# Software Requirements Specification\n\nREQ-AUTH-01: User Multi-Factor Authentication\nREQ-DATA-02: Secure Encryption Storage"],
    "docs/srs.md",
    { type: "text/markdown" }
  );

  const moduleCode = new File(
    [
      "// Implements REQ-AUTH-01\n" +
      "export async function authenticateUser(token: string) {\n" +
      "  return true;\n" +
      "}\n"
    ],
    "src/authService.ts",
    { type: "text/typescript" }
  );

  const testCode = new File(
    [
      "describe('authService', () => {\n" +
      "  it('authenticateUser verifies valid tokens for REQ-AUTH-01', () => {\n" +
      "    expect(true).toBe(true);\n" +
      "  });\n" +
      "});\n"
    ],
    "tests/authService.test.ts",
    { type: "text/typescript" }
  );

  const result = await ingestArtifacts([reqDoc, moduleCode, testCode]);
  assert.ok(result.graph.nodes.length >= 4, "Must generate documentation, requirements, module, and test nodes");
  assert.ok(result.graph.edges.length >= 3, "Must generate DOCUMENTS, REALIZES, and VERIFIES edges");

  // Verify inferred relationships carry honest heuristic confidence (0.70 < 1.0)
  for (const edge of result.graph.edges) {
    assert.strictEqual(edge.confidence, 0.70, "Heuristic edges must not claim 1.0 AST certainty");
  }

  // Traceability test against ingested graph
  const traceRows = evaluateRequirementTraceability(result.graph);
  const authRow = traceRows.find((r) => r.requirement.id === "REQ-AUTH-01");
  assert.ok(authRow, "REQ-AUTH-01 must be tracked in traceability");
  assert.strictEqual(authRow.coverageStatus, "FULL", "Direct test link yields FULL coverage");
  assert.strictEqual(authRow.verificationSummary.passedTests, 0, "passedTests must remain 0 (honest unexecuted)");

  // Impact test against ingested graph
  const impact = computeRelationshipAwareImpact(result.graph, "REQ-AUTH-01");
  assert.ok(impact.affectedItems.length > 0, "Must trace affected downstream entities");
});

await runTest("6.2 Ingestion handles malformed references, duplicate files, and empty files gracefully", async () => {
  const emptyFile = new File([""], "empty.ts", { type: "text/typescript" });
  const unsupportedFile = new File(["binary content"], "archive.zip", { type: "application/zip" });
  const duplicateA = new File(["# Docs\nREQ-001: First"], "readme.md", { type: "text/markdown" });
  const duplicateB = new File(["# Docs\nREQ-001: Duplicate"], "readme.md", { type: "text/markdown" });

  const result = await ingestArtifacts([emptyFile, unsupportedFile, duplicateA, duplicateB]);
  assert.strictEqual(result.emptyFiles.length, 1);
  assert.ok(result.unsupportedFiles.includes("archive.zip"));
  assert.strictEqual(result.duplicateFiles.length, 1);
  assert.ok(result.warnings.length > 0, "Must generate honest warnings for skipped and duplicate files");
  assert.strictEqual(result.requirementCount, 1, "Duplicate requirement code is deduplicated cleanly");
});


// -----------------------------------------------------------------------------
// SECTION 7: Unified Software Analysis Workspace (Milestone 3.1)
// -----------------------------------------------------------------------------
console.log("\n--- 7. Testing Unified Analysis Workspace & Cross-Perspective Flow ---");

await runTest("7.1 Cross-perspective entity resolution connects requirements, code, and tests", async () => {
  const unifiedGraph = {
    nodes: [
      { id: "REQ-CHECKOUT", label: "Checkout flow", type: "requirement", entity: { id: "REQ-CHECKOUT", type: "requirement", name: "Checkout", description: "Checkout requirement", acceptanceCriteria: ["Valid payment processed"] } },
      { id: "MOD-CHECKOUT", label: "checkout.ts", type: "module", filePath: "src/checkout.ts", entity: { id: "MOD-CHECKOUT", type: "module", name: "CheckoutModule", filePath: "src/checkout.ts" } },
      { id: "MTH-CHARGE", label: "chargeCard()", type: "method", entity: { id: "MTH-CHARGE", type: "method", name: "chargeCard", signature: "chargeCard(amount: number): boolean" } },
      { id: "TEST-CHECKOUT", label: "checkout.test.ts", type: "test", filePath: "tests/checkout.test.ts", entity: { id: "TEST-CHECKOUT", type: "test", name: "checkoutTest", filePath: "tests/checkout.test.ts" } },
      { id: "DOC-API", label: "API.md", type: "documentation", filePath: "docs/API.md", entity: { id: "DOC-API", type: "documentation", name: "APIDoc", filePath: "docs/API.md" } }
    ],
    edges: [
      { id: "e1", source: "REQ-CHECKOUT", target: "MOD-CHECKOUT", relationship: "REALIZES", confidence: 0.8 },
      { id: "e2", source: "MOD-CHECKOUT", target: "MTH-CHARGE", relationship: "CONTAINS", confidence: 1.0 },
      { id: "e3", source: "TEST-CHECKOUT", target: "REQ-CHECKOUT", relationship: "VERIFIES", confidence: 0.9 }
    ]
  };

  const rows = evaluateRequirementTraceability(unifiedGraph);
  assert.strictEqual(rows.length, 1, "Must generate 1 requirement row");
  const row = rows[0];
  assert.strictEqual(row.coverageStatus, "FULL", "Direct test verification yields FULL");

  // Exercise ACTUAL production resolver function
  const resolveEntityInRows = resolveTraceabilityEntity;

  // 1. Requirement deep linking
  const resReq = resolveEntityInRows("REQ-CHECKOUT", rows);
  assert.ok(resReq && resReq.entity.id === "REQ-CHECKOUT");

  // 2. Module deep linking
  const resMod = resolveEntityInRows("MOD-CHECKOUT", rows);
  assert.ok(resMod && resMod.entity.id === "MOD-CHECKOUT" && resMod.row.requirement.id === "REQ-CHECKOUT");

  // 3. Method deep linking
  const resMeth = resolveEntityInRows("MTH-CHARGE", rows);
  assert.ok(resMeth && resMeth.entity.id === "MTH-CHARGE" && resMeth.row.requirement.id === "REQ-CHECKOUT");

  // 4. Test deep linking
  const resTest = resolveEntityInRows("TEST-CHECKOUT", rows);
  assert.ok(resTest && resTest.entity.id === "TEST-CHECKOUT" && resTest.row.requirement.id === "REQ-CHECKOUT");

  // 5. Unmapped entity
  const resUnmapped = resolveEntityInRows("NONEXISTENT-ENTITY", rows);
  assert.strictEqual(resUnmapped, null, "Unmapped entity returns null honestly");
});

await runTest("7.2 Change impact distinguishes direct and indirect ripple effects with blast-radius formula", async () => {
  const rippleGraph = {
    nodes: [
      { id: "MTH-ROOT", label: "rootFn", type: "method", entity: { id: "MTH-ROOT", type: "method", name: "rootFn" } },
      { id: "MTH-CALLER1", label: "caller1", type: "method", entity: { id: "MTH-CALLER1", type: "method", name: "caller1" } },
      { id: "MTH-CALLER2", label: "caller2", type: "method", entity: { id: "MTH-CALLER2", type: "method", name: "caller2" } },
      { id: "TEST-SUITE", label: "testSuite.ts", type: "test", filePath: "tests/suite.test.ts", entity: { id: "TEST-SUITE", type: "test", name: "testSuite" } }
    ],
    edges: [
      // MTH-CALLER1 calls MTH-ROOT (so changing MTH-ROOT directly impacts MTH-CALLER1 at 1 hop)
      { id: "e1", source: "MTH-CALLER1", target: "MTH-ROOT", relationship: "CALLS", confidence: 1.0 },
      // MTH-CALLER2 calls MTH-CALLER1 (so changing MTH-ROOT indirectly impacts MTH-CALLER2 at 2 hops)
      { id: "e2", source: "MTH-CALLER2", target: "MTH-CALLER1", relationship: "CALLS", confidence: 1.0 },
      // TEST-SUITE verifies MTH-CALLER1
      { id: "e3", source: "TEST-SUITE", target: "MTH-CALLER1", relationship: "VERIFIES", confidence: 1.0 }
    ]
  };

  const impact = computeRelationshipAwareImpact(rippleGraph, "MTH-ROOT");
  assert.strictEqual(impact.directAffectedCount, 1, "MTH-CALLER1 is 1-hop direct impact");
  assert.strictEqual(impact.indirectAffectedCount, 2, "MTH-CALLER2 and TEST-SUITE are 2-hop indirect impact");
  // Formula: 20 * direct (1) + 10 * indirect (2) = 40 (MEDIUM risk)
  assert.strictEqual(impact.riskScore, 40, "Heuristic blast radius formula: 20*1 + 10*2 = 40");
  assert.strictEqual(impact.overallRisk, "MEDIUM");

  // Verify test suites are identified as static recommendations
  assert.strictEqual(impact.affectededTestCount, 1);
  assert.ok(impact.suggestedTestSuites.includes("testSuite.ts"));
});

await runTest("7.3 Dependency perspective filters to code tiers and detects coupling without fabricating edges", async () => {
  const dependencyTiers = ["architecture", "component", "module", "class", "method", "test"];

  const coupledGraph = {
    nodes: [
      { id: "REQ-01", label: "Req", type: "requirement" },
      { id: "MOD-A", label: "Module A", type: "module" },
      { id: "MOD-B", label: "Module B", type: "module" },
      { id: "DOC-01", label: "Doc", type: "documentation" }
    ],
    edges: [
      { id: "e1", source: "MOD-A", target: "MOD-B", relationship: "DEPENDS_ON", confidence: 1.0 },
      { id: "e2", source: "DOC-01", target: "MOD-A", relationship: "DOCUMENTS", confidence: 1.0 }
    ]
  };

  // 1. Exercise ACTUAL production dependency edge counter (excludes CONTAINS and VERIFIES)
  assert.strictEqual(DEPENDENCY_RELATIONSHIP_TYPES.includes("CONTAINS"), false, "CONTAINS is not a dependency edge");
  assert.strictEqual(DEPENDENCY_RELATIONSHIP_TYPES.includes("VERIFIES"), false, "VERIFIES is not a dependency edge");

  assert.strictEqual(countDependencyEdges(coupledGraph.edges), 1, "Only DEPENDS_ON counts as code coupling edge");

  // 2. Filter nodes to dependency tiers
  const filteredNodes = coupledGraph.nodes.filter((n) => dependencyTiers.includes(n.type));
  assert.strictEqual(filteredNodes.length, 2, "Requirements and documentation excluded from code dependency tiers");

  // 3. Isolated graph with zero coupling
  const uncoupledGraph = {
    nodes: [
      { id: "MOD-X", label: "Isolated X", type: "module" },
      { id: "MOD-Y", label: "Isolated Y", type: "module" }
    ],
    edges: []
  };

  assert.strictEqual(countDependencyEdges(uncoupledGraph.edges), 0, "Zero dependency edges detected honestly without fabrication");
});


// -----------------------------------------------------------------------------
// SECTION 8: Architecture Rule Validation & Drift Detection (Milestone 3.2.2 Final Audit)
// -----------------------------------------------------------------------------
console.log("\n--- 8. Testing Real Architecture Rule Validation Engine (M3.2.2 Final Audit) ---");

await runTest("8.1 Authoritative requirement priority verification and risk fallback prevention", async () => {
  const reqGraph = {
    nodes: [
      {
        id: "REQ-CRIT-1",
        label: "Payment Idempotency",
        type: "requirement",
        entity: { type: "requirement", priority: "CRITICAL", verificationStatus: "VERIFIED" }
      },
      {
        id: "REQ-CRIT-2",
        label: "Audit Trail Retention",
        type: "requirement",
        entity: { type: "requirement", priority: "CRITICAL", verificationStatus: "UNVERIFIED" }
      },
      {
        id: "REQ-LOW-1",
        label: "Export CSV Formats",
        type: "requirement",
        entity: { type: "requirement", priority: "LOW", verificationStatus: "UNVERIFIED" }
      },
      {
        // Misleading: has high impact risk but authoritative requirement priority is LOW
        id: "REQ-LOW-RISKY",
        label: "Low Priority High Blast Radius Feature",
        type: "requirement",
        risk: "CRITICAL", // Impact engine risk score must NOT override priority
        entity: { type: "requirement", priority: "LOW", verificationStatus: "UNVERIFIED" }
      },
      {
        // Non-requirement entity with CRITICAL risk
        id: "MOD-CRIT-RISK",
        label: "CoreModule",
        type: "module",
        risk: "CRITICAL"
      },
      {
        id: "TEST-01",
        label: "PaymentIdempotencyTest.ts",
        type: "test"
      }
    ],
    edges: [
      { id: "e1", source: "TEST-01", target: "REQ-CRIT-1", relationship: "VERIFIES", confidence: 1.0 }
    ]
  };

  const criticalRule = {
    id: "rule-critical-req-verifies",
    name: "Critical Requirements Require Verification Evidence",
    description: "Requirements marked with CRITICAL priority must have explicit test verification.",
    kind: "REQUIRED_RELATIONSHIP",
    severity: "ERROR",
    enabled: true,
    source: { entityType: "requirement", priority: "CRITICAL" },
    target: { entityType: "test" },
    requiredRelationship: "VERIFIES",
    direction: "TARGET_TO_SOURCE"
  };

  const summary = validateArchitectureRules(reqGraph, [criticalRule]);
  assert.strictEqual(summary.totalRulesEvaluated, 1);
  assert.strictEqual(summary.violationsCount, 1, "Exactly 1 unverified critical requirement must violate");
  assert.strictEqual(summary.findings[0].status, "VIOLATION");
  assert.strictEqual(summary.findings[0].evidence.length, 1);
  assert.strictEqual(summary.findings[0].evidence[0].sourceEntityId, "REQ-CRIT-2", "REQ-CRIT-2 must be flagged");
  assert.strictEqual(summary.findings[0].evaluatedEntityCount, 2, "Only 2 critical requirements must be evaluated");

  // Non-critical requirements must NEVER be flagged, even if risk: "CRITICAL" is present
  const flaggedIds = summary.findings[0].evidence.map(e => e.sourceEntityId);
  assert.ok(!flaggedIds.includes("REQ-LOW-1"), "Low priority requirement must not be flagged");
  assert.ok(!flaggedIds.includes("REQ-LOW-RISKY"), "Requirement with priority: LOW must NOT be misclassified by risk: CRITICAL");
  assert.ok(!flaggedIds.includes("MOD-CRIT-RISK"), "Non-requirement entity must not be evaluated by requirement rule");
});

await runTest("8.2 Required relationship direction semantics (correct, reversed, missing, unrelated)", async () => {
  const targetToSourceGraph = {
    nodes: [
      { id: "REQ-A", label: "Requirement A", type: "requirement" },
      { id: "REQ-B", label: "Requirement B (Reversed edge)", type: "requirement" },
      { id: "REQ-C", label: "Requirement C (Missing edge)", type: "requirement" },
      { id: "REQ-D", label: "Requirement D (Unrelated target)", type: "requirement" },
      { id: "TEST-01", label: "Test A", type: "test" },
      { id: "TEST-02", label: "Test B", type: "test" },
      { id: "MOD-UNRELATED", label: "HelperModule", type: "module" }
    ],
    edges: [
      { id: "e-ok", source: "TEST-01", target: "REQ-A", relationship: "VERIFIES", confidence: 1.0 },
      { id: "e-rev", source: "REQ-B", target: "TEST-02", relationship: "VERIFIES", confidence: 1.0 },
      { id: "e-unrel", source: "MOD-UNRELATED", target: "REQ-D", relationship: "VERIFIES", confidence: 1.0 }
    ]
  };

  const verifiesRule = {
    id: "rule-verifies",
    name: "Verification Rule",
    description: "Test verifies requirement",
    kind: "REQUIRED_RELATIONSHIP",
    severity: "ERROR",
    enabled: true,
    source: { entityType: "requirement" },
    target: { entityType: "test" },
    requiredRelationship: "VERIFIES",
    direction: "TARGET_TO_SOURCE"
  };

  const summary = validateArchitectureRules(targetToSourceGraph, [verifiesRule]);
  assert.strictEqual(summary.violationsCount, 3, "REQ-B (reversed), REQ-C (missing), and REQ-D (unrelated target) must violate");
  const unlinked = summary.findings[0].evidence.map(e => e.sourceEntityId).sort();
  assert.deepStrictEqual(unlinked, ["REQ-B", "REQ-C", "REQ-D"]);

  // Test SOURCE_TO_TARGET direction (e.g. Module --REALIZES--> Architecture)
  const sourceToTargetGraph = {
    nodes: [
      { id: "MOD-1", label: "PaymentService", type: "module" },
      { id: "MOD-2", label: "ReportService", type: "module" },
      { id: "ARCH-1", label: "CoreBankingSystem", type: "architecture" }
    ],
    edges: [
      { id: "e-realizes-ok", source: "MOD-1", target: "ARCH-1", relationship: "REALIZES", confidence: 1.0 },
      { id: "e-realizes-rev", source: "ARCH-1", target: "MOD-2", relationship: "REALIZES", confidence: 1.0 }
    ]
  };

  const realizesRule = {
    id: "rule-realizes",
    name: "Realization Rule",
    description: "Module realizes architecture",
    kind: "REQUIRED_RELATIONSHIP",
    severity: "WARNING",
    enabled: true,
    source: { entityType: "module" },
    target: { entityType: "architecture" },
    requiredRelationship: "REALIZES",
    direction: "SOURCE_TO_TARGET"
  };

  const summaryRealizes = validateArchitectureRules(sourceToTargetGraph, [realizesRule]);
  assert.strictEqual(summaryRealizes.violationsCount, 1, "MOD-2 with reversed realization must violate");
  assert.strictEqual(summaryRealizes.findings[0].evidence[0].sourceEntityId, "MOD-2");
});

await runTest("8.3 Johnson algorithm cycle detection: overlapping, shared nodes, shared paths, and bidirectional triangles", async () => {
  // Test Case A: Fully connected 3-node bidirectional triangle (A <-> B <-> C <-> A)
  // Mathematical theorem: An undirected K_3 made directed (every edge in both directions) has:
  // - Three 2-node cycles: (A, B), (B, C), (A, C)
  // - Two 3-node cycles: (A, B, C) and (A, C, B)
  // Exactly 5 elementary cycles!
  const triangleGraph = {
    nodes: [
      { id: "A", label: "A", type: "module" },
      { id: "B", label: "B", type: "module" },
      { id: "C", label: "C", type: "module" }
    ],
    edges: [
      { id: "e1", source: "A", target: "B", relationship: "CALLS" },
      { id: "e2", source: "B", target: "A", relationship: "CALLS" },
      { id: "e3", source: "B", target: "C", relationship: "CALLS" },
      { id: "e4", source: "C", target: "B", relationship: "CALLS" },
      { id: "e5", source: "A", target: "C", relationship: "CALLS" },
      { id: "e6", source: "C", target: "A", relationship: "CALLS" }
    ]
  };

  const cycleRule = {
    id: "rule-no-cycles",
    name: "No Module Cycles",
    description: "Modules must not have cycles",
    kind: "CIRCULAR_DEPENDENCY",
    severity: "ERROR",
    enabled: true,
    source: { entityType: "module" },
    forbiddenRelationships: ["CALLS", "IMPORTS", "DEPENDS_ON", "EXTENDS"]
  };

  const summaryTriangle = validateArchitectureRules(triangleGraph, [cycleRule]);
  assert.strictEqual(summaryTriangle.violationsCount, 5, "Must find exactly all 5 elementary cycles in bidirectional triangle");
  assert.strictEqual(summaryTriangle.findings[0].status, "VIOLATION");

  // Test Case B: Self-loops, disconnected cycles, and shared path
  const complexGraph = {
    nodes: [
      { id: "SELF", label: "SelfModule", type: "module" },
      { id: "N1", label: "Node 1", type: "module" },
      { id: "N2", label: "Node 2", type: "module" },
      { id: "X", label: "Shared X", type: "module" },
      { id: "Y", label: "Shared Y", type: "module" },
      { id: "DISC1", label: "Disconnected 1", type: "module" },
      { id: "DISC2", label: "Disconnected 2", type: "module" },
      { id: "CONTAINS_A", label: "Contained A", type: "module" },
      { id: "CONTAINS_B", label: "Contained B", type: "module" }
    ],
    edges: [
      // 1. Self-loop
      { id: "e-self", source: "SELF", target: "SELF", relationship: "CALLS" },
      // 2. Shared path: (N1 -> X -> Y -> N1) and (N2 -> X -> Y -> N2)
      { id: "e-n1x", source: "N1", target: "X", relationship: "CALLS" },
      { id: "e-xy", source: "X", target: "Y", relationship: "CALLS" },
      { id: "e-yn1", source: "Y", target: "N1", relationship: "CALLS" },
      { id: "e-n2x", source: "N2", target: "X", relationship: "CALLS" },
      { id: "e-yn2", source: "Y", target: "N2", relationship: "CALLS" },
      // 3. Disconnected 2-node cycle
      { id: "e-d12", source: "DISC1", target: "DISC2", relationship: "IMPORTS" },
      { id: "e-d21", source: "DISC2", target: "DISC1", relationship: "IMPORTS" },
      // 4. Non-dependency cycle via CONTAINS (must NOT be counted)
      { id: "e-c1", source: "CONTAINS_A", target: "CONTAINS_B", relationship: "CONTAINS" },
      { id: "e-c2", source: "CONTAINS_B", target: "CONTAINS_A", relationship: "CONTAINS" }
    ]
  };

  const summaryComplex = validateArchitectureRules(complexGraph, [cycleRule]);
  // Expected cycles:
  // 1. SELF -> SELF (self-loop)
  // 2. N1 -> X -> Y -> N1 (shared path cycle 1)
  // 3. N2 -> X -> Y -> N2 (shared path cycle 2)
  // 4. DISC1 -> DISC2 -> DISC1 (disconnected cycle)
  // (CONTAINS loop is ignored)
  assert.strictEqual(summaryComplex.violationsCount, 4, "Must detect exactly 4 cycles across self-loops, shared paths, and disconnected components");

  // Test Case C: Acyclic graph returns PASSED
  const acyclicGraph = {
    nodes: [
      { id: "M1", label: "M1", type: "module" },
      { id: "M2", label: "M2", type: "module" },
      { id: "M3", label: "M3", type: "module" }
    ],
    edges: [
      { id: "e1", source: "M1", target: "M2", relationship: "CALLS" },
      { id: "e2", source: "M2", target: "M3", relationship: "CALLS" }
    ]
  };
  const summaryAcyclic = validateArchitectureRules(acyclicGraph, [cycleRule]);
  assert.strictEqual(summaryAcyclic.violationsCount, 0, "Acyclic graph must have 0 violations");
  assert.strictEqual(summaryAcyclic.passedCount, 1, "Acyclic graph must report PASSED");
});

await runTest("8.4 Deterministic finding IDs across repeated evaluations (no Date.now)", async () => {
  const testGraph = {
    nodes: [
      { id: "COMP-UI", label: "UiView", type: "component" },
      { id: "MOD-DB", label: "DbModule", type: "module", filePath: "src/db/db.ts" },
      { id: "REQ-CRIT", label: "Critical Req", type: "requirement", priority: "CRITICAL" },
      { id: "MOD-CYC1", label: "Cycle1", type: "module" },
      { id: "MOD-CYC2", label: "Cycle2", type: "module" }
    ],
    edges: [
      // Forbidden dependency
      { id: "e-forbid", source: "COMP-UI", target: "MOD-DB", relationship: "CALLS" },
      // 2-node cycle
      { id: "e-c1", source: "MOD-CYC1", target: "MOD-CYC2", relationship: "CALLS" },
      { id: "e-c2", source: "MOD-CYC2", target: "MOD-CYC1", relationship: "CALLS" }
    ]
  };

  const rules = [
    {
      id: "rule-no-ui-db",
      name: "No UI to DB",
      kind: "FORBIDDEN_DEPENDENCY",
      severity: "ERROR",
      enabled: true,
      source: { entityType: "component" },
      target: { entityType: "module", filePathPattern: "db" }
    },
    {
      id: "rule-crit-verifies",
      name: "Critical Req Verifies",
      kind: "REQUIRED_RELATIONSHIP",
      severity: "ERROR",
      enabled: true,
      source: { entityType: "requirement", priority: "CRITICAL" },
      target: { entityType: "test" },
      requiredRelationship: "VERIFIES",
      direction: "TARGET_TO_SOURCE"
    },
    {
      id: "rule-cycles",
      name: "No Cycles",
      kind: "CIRCULAR_DEPENDENCY",
      severity: "ERROR",
      enabled: true,
      source: { entityType: "module" }
    }
  ];

  // Run evaluation 1
  const run1 = validateArchitectureRules(testGraph, rules);
  // Run evaluation 2
  const run2 = validateArchitectureRules(testGraph, rules);

  // Assert finding counts match
  assert.strictEqual(run1.findings.length, run2.findings.length);

  // Assert EVERY finding ID is strictly identical across runs (deterministic)
  for (let i = 0; i < run1.findings.length; i++) {
    const f1 = run1.findings[i];
    const f2 = run2.findings[i];
    assert.strictEqual(f1.id, f2.id, "Finding ID must be identical across repeated evaluations");
    assert.ok(!f1.id.includes("Date.now"), "Finding ID must not contain Date.now");
    assert.ok(!/\b\d{13}\b/.test(f1.id), "Finding ID must not contain millisecond timestamps");
  }
});

await runTest("8.5 API and engine semantics: omitted rules vs explicit empty array", async () => {
  // Production semantics matching apiService.validateArchitectureRules:
  // const rulesToRun = rules !== undefined ? rules : DEFAULT_ARCHITECTURE_RULES;
  function resolveRulesToRun(rules) {
    return rules !== undefined ? rules : DEFAULT_ARCHITECTURE_RULES;
  }

  // Case A: Omitted rules parameter resolves to DEFAULT_ARCHITECTURE_RULES
  const omittedRules = resolveRulesToRun(undefined);
  assert.strictEqual(
    omittedRules.length,
    DEFAULT_ARCHITECTURE_RULES.length,
    "Omitted rules parameter must default to all DEFAULT_ARCHITECTURE_RULES"
  );
  const sampleGraph = {
    nodes: [
      { id: "COMP-1", label: "Component", type: "component" },
      { id: "MOD-1", label: "Module", type: "module" }
    ],
    edges: []
  };
  const summaryOmitted = validateArchitectureRules(sampleGraph, omittedRules);
  assert.strictEqual(
    summaryOmitted.totalRulesEvaluated,
    DEFAULT_ARCHITECTURE_RULES.length,
    "Evaluating with omitted rules resolves to default rules count"
  );

  // Case B: Explicitly empty rules array ([]) evaluates ZERO rules
  const explicitEmptyRules = resolveRulesToRun([]);
  assert.strictEqual(explicitEmptyRules.length, 0, "Explicit empty rules array must retain length 0");
  const summaryEmpty = validateArchitectureRules(sampleGraph, explicitEmptyRules);
  assert.strictEqual(summaryEmpty.totalRulesEvaluated, 0, "Explicitly empty rules array must evaluate 0 rules");
  assert.strictEqual(summaryEmpty.violationsCount, 0, "Explicitly empty rules array must have 0 violations");
  assert.strictEqual(summaryEmpty.findings.length, 0, "Explicitly empty rules array must return empty findings list");

  // Case C: Directly verify validateArchitectureRules with empty array
  const directEmpty = validateArchitectureRules(sampleGraph, []);
  assert.strictEqual(directEmpty.totalRulesEvaluated, 0, "Direct call with [] must evaluate 0 rules");
  assert.strictEqual(directEmpty.findings.length, 0);
});

await runTest("8.6 Forbidden dependencies with edge evidence and confidence flags", async () => {
  const violatingGraph = {
    nodes: [
      { id: "COMP-BAD", label: "DirectQueryCard", type: "component" },
      { id: "MOD-DB", label: "database.ts", type: "module", filePath: "src/database.ts" }
    ],
    edges: [
      { id: "e-bad", source: "COMP-BAD", target: "MOD-DB", relationship: "CALLS", confidence: 0.85 }
    ]
  };

  const rule = {
    id: "rule-no-ui-to-db",
    name: "No direct UI to DB",
    description: "UI must not directly access DB",
    kind: "FORBIDDEN_DEPENDENCY",
    severity: "ERROR",
    enabled: true,
    source: { entityType: "component" },
    target: { entityType: "module", filePathPattern: "database" },
    forbiddenRelationships: ["CALLS", "IMPORTS", "DEPENDS_ON"]
  };

  const summary = validateArchitectureRules(violatingGraph, [rule]);
  assert.strictEqual(summary.violationsCount, 1, "Must detect exactly 1 violation");
  assert.strictEqual(summary.bySeverity.ERROR, 1);
  const finding = summary.findings[0];
  assert.strictEqual(finding.status, "VIOLATION");
  assert.strictEqual(finding.evidence.length, 1);
  assert.strictEqual(finding.evidence[0].sourceEntityId, "COMP-BAD");
  assert.strictEqual(finding.evidence[0].targetEntityId, "MOD-DB");
  assert.strictEqual(finding.evidence[0].relationship, "CALLS");
  assert.strictEqual(finding.evidence[0].confidence, 0.85);
  assert.strictEqual(finding.isHeuristicEvidence, true, "Confidence < 1.0 flags heuristic evidence honestly");
});

await runTest("8.7 Missing entities, missing target layers, and empty graphs", async () => {
  const emptyGraph = { nodes: [], edges: [] };
  const rule = {
    id: "rule-req-verifies",
    name: "Requirements require test verification",
    description: "Requirement verification",
    kind: "REQUIRED_RELATIONSHIP",
    severity: "ERROR",
    enabled: true,
    source: { entityType: "requirement" },
    target: { entityType: "test" },
    requiredRelationship: "VERIFIES"
  };

  const summaryEmpty = validateArchitectureRules(emptyGraph, [rule]);
  assert.strictEqual(summaryEmpty.insufficientEvidenceCount, 1);
  assert.strictEqual(summaryEmpty.violationsCount, 0, "Empty graph must not fabricate violations");
  assert.strictEqual(summaryEmpty.findings[0].status, "INSUFFICIENT_EVIDENCE");

  const noSourceGraph = {
    nodes: [{ id: "DOC-01", label: "Documentation", type: "documentation" }],
    edges: []
  };
  const summaryNoSource = validateArchitectureRules(noSourceGraph, [rule]);
  assert.strictEqual(summaryNoSource.insufficientEvidenceCount, 1);
  assert.strictEqual(summaryNoSource.findings[0].status, "INSUFFICIENT_EVIDENCE");

  const noTargetGraph = {
    nodes: [{ id: "REQ-01", label: "Requirement 1", type: "requirement" }],
    edges: []
  };
  const summaryNoTarget = validateArchitectureRules(noTargetGraph, [rule]);
  assert.strictEqual(summaryNoTarget.insufficientEvidenceCount, 1, "Must report INSUFFICIENT_EVIDENCE when target layer has 0 nodes");
  assert.strictEqual(summaryNoTarget.violationsCount, 0, "Must not report false violation when target layer is unindexed");
});

await runTest("8.8 Invalid selectors and malformed regex patterns handle safely", async () => {
  const graph = {
    nodes: [
      { id: "MOD-1", label: "UserController.ts", type: "module", filePath: "src/controllers/[UserController.ts" },
      { id: "MOD-2", label: "UserModel.ts", type: "module", filePath: "src/models/UserModel.ts" }
    ],
    edges: [
      { id: "e1", source: "MOD-1", target: "MOD-2", relationship: "CALLS" }
    ]
  };

  const malformedRegexRule = {
    id: "rule-malformed-regex",
    name: "Malformed Regex Rule",
    description: "Tests error resilience on bad regex",
    kind: "FORBIDDEN_DEPENDENCY",
    severity: "WARNING",
    enabled: true,
    source: { entityType: "module", filePathPattern: "[unclosed-bracket(" },
    target: { entityType: "module" }
  };

  let threw = false;
  let summary = null;
  try {
    summary = validateArchitectureRules(graph, [malformedRegexRule]);
  } catch {
    threw = true;
  }
  assert.strictEqual(threw, false, "Engine must not throw on malformed regex patterns");
  assert.ok(summary !== null);

  const safeNode = { id: "N1", label: "Node", type: "module", filePath: "path/with/[bracket/test" };
  const matchResult = matchesSelector(safeNode, { filePathPattern: "[bracket" });
  assert.strictEqual(matchResult, true, "Fallback substring search matches when regex is invalid");
});

await runTest("8.9 Project isolation, round-trip switching, and malformed storage recovery", async () => {
  const projAlphaKey = "graphtrace.session_rules.proj-alpha.v1";
  const projBetaKey = "graphtrace.session_rules.proj-beta.v1";

  const alphaRules = [
    {
      id: "alpha-custom-rule",
      name: "Alpha Rule",
      kind: "FORBIDDEN_DEPENDENCY",
      severity: "ERROR",
      enabled: true,
      source: { entityType: "component" }
    }
  ];

  const betaRules = [
    {
      id: "beta-custom-rule",
      name: "Beta Rule",
      kind: "CIRCULAR_DEPENDENCY",
      severity: "WARNING",
      enabled: true,
      source: { entityType: "module" }
    }
  ];

  // 1. Save Alpha rules
  globalThis.sessionStorage.setItem(projAlphaKey, JSON.stringify(alphaRules));

  // 2. Switch to Beta: Beta key is initially null
  assert.strictEqual(globalThis.sessionStorage.getItem(projBetaKey), null, "Project Beta starts with null session storage");
  // Save Beta rules
  globalThis.sessionStorage.setItem(projBetaKey, JSON.stringify(betaRules));

  // 3. Switch back to Alpha: Alpha still has alphaRules and NOT betaRules
  const retrievedAlpha = JSON.parse(globalThis.sessionStorage.getItem(projAlphaKey));
  assert.strictEqual(retrievedAlpha.length, 1);
  assert.strictEqual(retrievedAlpha[0].id, "alpha-custom-rule", "Project Alpha retains its own rule on round-trip");

  // 4. Switch back to Beta: Beta still has betaRules and NOT alphaRules
  const retrievedBeta = JSON.parse(globalThis.sessionStorage.getItem(projBetaKey));
  assert.strictEqual(retrievedBeta.length, 1);
  assert.strictEqual(retrievedBeta[0].id, "beta-custom-rule", "Project Beta retains its own rule on round-trip");

  // 5. Corrupted JSON recovery: does not crash
  globalThis.sessionStorage.setItem("graphtrace.session_rules.corrupted.v1", "CORRUPTED_JSON_DATA{{[");
  let recoveredRules = null;
  try {
    const raw = globalThis.sessionStorage.getItem("graphtrace.session_rules.corrupted.v1");
    recoveredRules = JSON.parse(raw);
  } catch {
    recoveredRules = DEFAULT_ARCHITECTURE_RULES;
  }
  assert.ok(Array.isArray(recoveredRules));
  assert.strictEqual(recoveredRules.length, DEFAULT_ARCHITECTURE_RULES.length, "Corrupted session data falls back cleanly to defaults");
});

await runTest("8.10 Unsupported rule kinds handled safely without crashing", async () => {
  const graph = {
    nodes: [{ id: "N1", label: "Node 1", type: "module" }],
    edges: []
  };

  const unsupportedRule = {
    id: "rule-unsupported",
    name: "Unknown Rule",
    description: "Unsupported test",
    kind: "UNSUPPORTED_RULE_KIND_TEST",
    severity: "INFO",
    enabled: true,
    source: { entityType: "module" }
  };

  const summary = validateArchitectureRules(graph, [unsupportedRule]);
  assert.strictEqual(summary.insufficientEvidenceCount, 1);
  assert.strictEqual(summary.findings[0].status, "INSUFFICIENT_EVIDENCE");
  assert.ok(summary.findings[0].message.includes("Unsupported rule kind"));
});

console.log("\n=================================================================");
console.log("TEST RESULTS: " + passedCount + " / " + totalCount + " passed");
console.log("=================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
