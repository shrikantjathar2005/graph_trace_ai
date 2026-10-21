"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, IconName } from "@/components/ui/Icons";
import { useProject } from "@/context/ProjectContext";

type NodeName =
  | "Frontend"
  | "API Gateway"
  | "Auth Service"
  | "Order Service"
  | "Payment"
  | "PostgreSQL";

interface NodeDetails {
  icon: IconName;
  meta: string;
  type: string;
  display: string;
  filePath: string;
  usedBy: number;
  dependsOn: number;
  testedBy: string;
  requirement: string;
  loc: number;
  complexity: string;
  lastModified: string;
  author: string;
  coverage: number;
  language: string;
  codeLines: Array<{ num: number; code: string; isSelected?: boolean; isFocus?: boolean }>;
  aiQuestion: string;
  aiAnswer: string;
  evidenceLine: string;
  evidenceCode: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  controllers: number;
  apis: number;
  tests: number;
  reqs: number;
  blastRadius: number;
}

const nodeDetailsMap: Record<NodeName, NodeDetails> = {
  Frontend: {
    icon: "code",
    meta: "React application",
    type: "React App",
    display: "FrontendApp",
    filePath: "src/components/layout/AppShell.tsx",
    usedBy: 0,
    dependsOn: 1,
    testedBy: "12 tests",
    requirement: "UI-001",
    loc: 540,
    complexity: "Moderate",
    lastModified: "Just now",
    author: "A. Miller",
    coverage: 90,
    language: "TSX",
    codeLines: [
      { num: 12, code: "export function AppShell({ children }: AppShellProps) {" },
      { num: 13, code: "  const [currentProject, setCurrentProject] = useState(defaultProjects[0]);" },
      { num: 14, code: "  const [commandOpen, setCommandOpen] = useState(false);", isSelected: true },
      { num: 15, code: "  return <div className=\"app-shell\">{children}</div>;", isFocus: true },
      { num: 16, code: "}" },
    ],
    aiQuestion: "How does the UI communicate with backend microservices?",
    aiAnswer: "All frontend client network calls target API Gateway reverse proxy endpoints with centralized authorization headers.",
    evidenceLine: "LINE 15",
    evidenceCode: "gatewayClient.get('/api/v1/system-map')",
    risk: "LOW",
    controllers: 1,
    apis: 12,
    tests: 12,
    reqs: 2,
    blastRadius: 5,
  },
  "API Gateway": {
    icon: "api",
    meta: "12 endpoints",
    type: "Gateway",
    display: "ApiGateway",
    filePath: "src/main/java/com/acme/gateway/ApiGateway.java",
    usedBy: 1,
    dependsOn: 4,
    testedBy: "8 tests",
    requirement: "GW-004",
    loc: 620,
    complexity: "High",
    lastModified: "1 day ago",
    author: "S. Rao",
    coverage: 92,
    language: "JAVA",
    codeLines: [
      { num: 34, code: "@Bean" },
      { num: 35, code: "public RouteLocator routes(RouteLocatorBuilder builder) {" },
      { num: 36, code: "  return builder.routes()", isSelected: true },
      { num: 37, code: "    .route(\"auth\", r -> r.path(\"/auth/**\").uri(\"lb://auth-service\"))", isFocus: true },
      { num: 38, code: "    .route(\"order\", r -> r.path(\"/orders/**\").uri(\"lb://order-service\"))" },
      { num: 39, code: "    .build();" },
      { num: 40, code: "}" },
    ],
    aiQuestion: "How does API Gateway route authentication calls?",
    aiAnswer: "API Gateway intercepts /auth/** traffic and applies token verification before dispatching to Auth Service instances.",
    evidenceLine: "LINE 37",
    evidenceCode: "r.path(\"/auth/**\").uri(\"lb://auth-service\")",
    risk: "HIGH",
    controllers: 6,
    apis: 12,
    tests: 14,
    reqs: 3,
    blastRadius: 21,
  },
  "Auth Service": {
    icon: "box",
    meta: "Java service",
    type: "Service",
    display: "AuthService",
    filePath: "src/main/java/com/acme/auth/AuthService.java",
    usedBy: 3,
    dependsOn: 4,
    testedBy: "2 tests",
    requirement: "AUTH-001",
    loc: 482,
    complexity: "Moderate",
    lastModified: "3 days ago",
    author: "A. Miller",
    coverage: 87,
    language: "JAVA",
    codeLines: [
      { num: 48, code: "public String authenticate(Credentials credentials) {" },
      { num: 49, code: "  User user = userRepository.find(credentials.email());" },
      { num: 50, code: "  if (passwordEncoder.matches(credentials.password(), user.hash())) {", isSelected: true },
      { num: 51, code: "    return jwtService.generateToken(user);", isFocus: true },
      { num: 52, code: "  }" },
      { num: 53, code: "  throw new AuthenticationException();" },
      { num: 54, code: "}" },
    ],
    aiQuestion: "Why does AuthService depend on JWTService?",
    aiAnswer: "AuthService uses JWTService to generate cryptographically signed HMAC-SHA256 access tokens upon successful credential verification.",
    evidenceLine: "LINE 51",
    evidenceCode: "jwtService.generateToken(user)",
    risk: "MEDIUM",
    controllers: 4,
    apis: 2,
    tests: 6,
    reqs: 1,
    blastRadius: 13,
  },
  "Order Service": {
    icon: "box",
    meta: "Java service",
    type: "Service",
    display: "OrderService",
    filePath: "src/main/java/com/acme/order/OrderService.java",
    usedBy: 1,
    dependsOn: 2,
    testedBy: "5 tests",
    requirement: "ORD-102",
    loc: 730,
    complexity: "High",
    lastModified: "5 days ago",
    author: "K. Sharma",
    coverage: 84,
    language: "JAVA",
    codeLines: [
      { num: 41, code: "@Transactional" },
      { num: 42, code: "public OrderResponse placeOrder(OrderRequest request) {" },
      { num: 43, code: "  PaymentResult payment = paymentClient.process(request.payment());", isSelected: true },
      { num: 44, code: "  if (!payment.isSuccessful()) throw new PaymentDeclinedException();", isFocus: true },
      { num: 45, code: "  return orderRepository.save(new Order(request, payment.txnId()));" },
      { num: 46, code: "}" },
    ],
    aiQuestion: "Does OrderService interact directly with Stripe?",
    aiAnswer: "OrderService delegates processing to PaymentService client rather than calling Stripe directly, maintaining bounded context isolation.",
    evidenceLine: "LINE 43",
    evidenceCode: "paymentClient.process(request.payment())",
    risk: "HIGH",
    controllers: 3,
    apis: 4,
    tests: 9,
    reqs: 2,
    blastRadius: 16,
  },
  Payment: {
    icon: "external",
    meta: "Stripe integration",
    type: "Integration",
    display: "PaymentClient",
    filePath: "src/services/payment/PaymentClient.ts",
    usedBy: 2,
    dependsOn: 1,
    testedBy: "4 tests",
    requirement: "PAY-088",
    loc: 310,
    complexity: "Low",
    lastModified: "6 hours ago",
    author: "O. Deshmukh",
    coverage: 95,
    language: "TS",
    codeLines: [
      { num: 18, code: "export async function chargeCustomer(payload: ChargeRequest) {" },
      { num: 19, code: "  const session = await stripe.paymentIntents.create({", isSelected: true },
      { num: 20, code: "    amount: payload.amountInCents, currency: 'usd', customer: payload.customerId", isFocus: true },
      { num: 21, code: "  });" },
      { num: 22, code: "  return session.status === 'succeeded';" },
      { num: 23, code: "}" },
    ],
    aiQuestion: "What protocol does Payment use for Stripe webhooks?",
    aiAnswer: "Payment client verifies incoming HMAC signatures against webhook secrets using SHA-256 before emitting confirmation events.",
    evidenceLine: "LINE 19",
    evidenceCode: "stripe.paymentIntents.create({...})",
    risk: "MEDIUM",
    controllers: 2,
    apis: 2,
    tests: 8,
    reqs: 1,
    blastRadius: 9,
  },
  PostgreSQL: {
    icon: "database",
    meta: "24 tables",
    type: "Database",
    display: "PostgresSchema",
    filePath: "db/migrations/20261008_schema.sql",
    usedBy: 3,
    dependsOn: 0,
    testedBy: "18 tests",
    requirement: "DB-001",
    loc: 890,
    complexity: "Moderate",
    lastModified: "1 week ago",
    author: "R. Patel",
    coverage: 98,
    language: "SQL",
    codeLines: [
      { num: 101, code: "CREATE TABLE orders (" },
      { num: 102, code: "  id UUID PRIMARY KEY DEFAULT gen_random_uuid()," },
      { num: 103, code: "  user_id UUID NOT NULL REFERENCES users(id),", isSelected: true },
      { num: 104, code: "  amount NUMERIC(12, 2) NOT NULL,", isFocus: true },
      { num: 105, code: "  status VARCHAR(32) NOT NULL" },
      { num: 106, code: ");" },
    ],
    aiQuestion: "What tables do Auth and Order services query?",
    aiAnswer: "AuthService accesses users and permissions tables, while OrderService queries orders, line_items, and transactions.",
    evidenceLine: "LINE 103",
    evidenceCode: "REFERENCES users(id)",
    risk: "HIGH",
    controllers: 5,
    apis: 8,
    tests: 22,
    reqs: 4,
    blastRadius: 28,
  },
};

const kpis: [IconName, string, string][] = [
  ["box", "245", "Classes"],
  ["code", "1.2K", "Methods"],
  ["api", "48", "APIs"],
  ["test", "96", "Tests"],
  ["trace", "24", "Requirements"],
];

const relatedGraph: Record<NodeName, NodeName[]> = {
  Frontend: ["API Gateway"],
  "API Gateway": ["Frontend", "Auth Service", "Order Service", "Payment"],
  "Auth Service": ["API Gateway", "PostgreSQL"],
  "Order Service": ["API Gateway", "PostgreSQL"],
  Payment: ["API Gateway", "PostgreSQL"],
  PostgreSQL: ["Auth Service", "Order Service", "Payment"],
};

export default function OverviewPage() {
  const router = useRouter();
  const [mode, setMode] = useState("Graph");
  const [selected, setSelected] = useState<NodeName>("Auth Service");
  const { currentProject } = useProject();
  const [inspectorTab, setInspectorTab] = useState("Overview");
  const [evidenceVisible, setEvidenceVisible] = useState(true);
  const [graphSearch, setGraphSearch] = useState("");
  const [zoomLevel, setZoomLevel] = useState("1:1");

  const dynamicKpis: Array<[IconName, string | number, string]> =
    currentProject.id === "fintrack"
      ? kpis
      : [
          ["file", currentProject.counts?.files ?? 0, "Files Scanned"],
          ["layers", currentProject.counts?.modules ?? 0, "Modules"],
          ["code", currentProject.counts?.methods ?? 0, "Functions"],
          ["trace", currentProject.counts?.requirements ?? 0, "Requirements"],
          ["map", currentProject.counts?.relationships ?? 0, "Relationships"],
        ];

  const current = nodeDetailsMap[selected];

  const handleZoomIn = () => setZoomLevel("1.25x");
  const handleZoomReset = () => setZoomLevel("1:1");
  const handleZoomOut = () => setZoomLevel("0.75x");

  return (
    <div className="overview-container">
      {/* Central Workspace */}
      <main className="workspace">
        {/* Workspace Toolbar */}
        <div className="workspace-toolbar">
          <div>
            <h1 className="flex items-center gap-2">
              <span>System Architecture Map</span>
              <span className="text-xs font-normal text-[var(--text-muted)] truncate max-w-[220px]">
                · {currentProject.name}
              </span>
            </h1>
            <span className={`live-status ${currentProject.isSample ? "text-amber-400" : "text-emerald-400"}`}>
              <i className={currentProject.isSample ? "!bg-amber-400 !shadow-[0_0_6px_rgba(251,191,36,0.6)]" : "!bg-[var(--success)] !shadow-[0_0_6px_rgba(52,211,153,0.6)]"} />
              {currentProject.isSample ? "Reference Sample Model (Demonstration Data)" : "Local Indexed Workspace (Parsed In-Browser)"}
            </span>
          </div>

          <div className="mode-switch">
            {["Graph", "Blueprint", "Layers"].map((x) => (
              <button
                key={x}
                type="button"
                className={`control ${mode === x ? "active" : ""}`}
                onClick={() => setMode(x)}
              >
                {x}
              </button>
            ))}
            <Link
              href="/graph"
              className="control px-2 hover:text-white"
              title="Open full 8-tier knowledge graph explorer"
            >
              <Icon name="maximize" size={14} />
            </Link>
          </div>
        </div>

        {/* 5 Glass KPI Cards */}
        <div className="kpi-row">
          {dynamicKpis.map(([icon, value, label]) => (
            <div className="kpi-card" key={label}>
              <span className="kpi-icon">
                <Icon name={icon} size={16} />
              </span>
              <div>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Graph Panel Canvas */}
        <section className="graph-panel panel">
          <div className="panel-header graph-header">
            <div>
              <h2>System Architecture Map</h2>
              <p>Visualize the structure, dependencies, and blast radius in your codebase</p>
            </div>
            <div className="panel-actions">
              <div className="search-box">
                <Icon name="search" size={14} />
                <input
                  aria-label="Search in graph..."
                  placeholder="Search in graph..."
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="control small-button"
                onClick={() => router.push("/graph")}
              >
                <Icon name="filter" size={13} />
                Filters
              </button>
              <button
                type="button"
                className="control icon-button"
                aria-label="More options"
                onClick={() => alert("Architecture Map mode: " + mode)}
              >
                <Icon name="more" size={15} />
              </button>
            </div>
          </div>

          <div
            className="graph-canvas"
            style={{
              transform:
                zoomLevel === "1.25x"
                  ? "scale(1.08)"
                  : zoomLevel === "0.75x"
                  ? "scale(0.92)"
                  : "scale(1)",
              transition: "transform 240ms ease",
            }}
          >
            {/* SVG Connecting Edges with Arrowheads */}
            <svg
              className="edges"
              viewBox="0 0 800 390"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L7,3 z" />
                </marker>
              </defs>

              <path
                className={
                  selected === "Frontend" || selected === "API Gateway"
                    ? "edge active"
                    : "edge"
                }
                d="M400 65V108"
              />
              <path
                className={
                  selected === "API Gateway" || selected === "Auth Service"
                    ? "edge active"
                    : "edge"
                }
                d="M400 165V190H190V225"
              />
              <path
                className={
                  selected === "API Gateway" || selected === "Order Service"
                    ? "edge active"
                    : "edge"
                }
                d="M400 165V225"
              />
              <path
                className={
                  selected === "API Gateway" || selected === "Payment"
                    ? "edge active"
                    : "edge"
                }
                d="M400 165V190H610V225"
              />
              <path
                className={
                  selected === "Auth Service" || selected === "PostgreSQL"
                    ? "edge active"
                    : "edge"
                }
                d="M190 282V310H400V345"
              />
              <path
                className={
                  selected === "Order Service" || selected === "PostgreSQL"
                    ? "edge active"
                    : "edge"
                }
                d="M400 282V345"
              />
              <path
                className={
                  selected === "Payment" || selected === "PostgreSQL"
                    ? "edge active"
                    : "edge"
                }
                d="M610 282V310H400V345"
              />
            </svg>

            {/* Interactive Graph Nodes */}
            {(Object.keys(nodeDetailsMap) as NodeName[]).map((name) => {
              const details = nodeDetailsMap[name];
              const isSelected = selected === name;
              const isFaded =
                selected !== name && !relatedGraph[selected].includes(name);
              const nodeClass = `node-${name.toLowerCase().replaceAll(" ", "-")}`;

              // If search is active, highlight matching
              const isMatch =
                !graphSearch ||
                name.toLowerCase().includes(graphSearch.toLowerCase()) ||
                details.meta.toLowerCase().includes(graphSearch.toLowerCase());

              return (
                <button
                  type="button"
                  key={name}
                  className={`control graph-node ${nodeClass} ${
                    isSelected ? "selected" : ""
                  } ${isFaded || !isMatch ? "faded" : ""}`}
                  onClick={() => setSelected(name)}
                >
                  <span className="node-icon">
                    <Icon name={details.icon} size={16} />
                  </span>
                  <span className="node-copy">
                    <b>{name}</b>
                    <small>{details.meta}</small>
                  </span>
                </button>
              );
            })}

            {/* Zoom Controls */}
            <div className="zoom-controls">
              <button
                type="button"
                className="control"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                title="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                className="control"
                onClick={handleZoomReset}
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                {zoomLevel}
              </button>
              <button
                type="button"
                className="control"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                title="Zoom out"
              >
                −
              </button>
            </div>

            {/* Legend */}
            <div className="graph-legend">
              <span>
                <i className="legend-line solid" />
                Calls
              </span>
              <span>
                <i className="legend-line dashed" />
                Depends on
              </span>
              <span>
                <i className="legend-line active" />
                Active path
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Right Inspector Panel */}
      <aside className="inspector panel">
        <div className="inspector-title">
          <span className="large-node-icon">
            <Icon name={current.icon} size={20} />
          </span>
          <div>
            <h2>{current.display}</h2>
            <span className="type-badge">{current.type}</span>
          </div>
          <button
            type="button"
            className="control icon-button"
            aria-label="More options"
            onClick={() => router.push(`/graph?entity=${encodeURIComponent(selected)}`)}
            title="Inspect in 8-tier graph"
          >
            <Icon name="more" size={16} />
          </button>
        </div>

        <p className="file-path">{current.filePath}</p>

        <div className="tabs">
          {["Overview", "Relations", "Code", "Tests"].map((x) => (
            <button
              key={x}
              type="button"
              className={`control ${inspectorTab === x ? "active" : ""}`}
              onClick={() => setInspectorTab(x)}
            >
              {x}
            </button>
          ))}
        </div>

        <div className="inspector-content">
          <span className="section-label">RELATIONSHIPS</span>
          <dl>
            <div>
              <dt>Used by</dt>
              <dd>{current.usedBy} callers</dd>
            </div>
            <div>
              <dt>Depends on</dt>
              <dd>{current.dependsOn} components</dd>
            </div>
            <div>
              <dt>Tested by</dt>
              <dd
                className="link-value cursor-pointer"
                onClick={() => router.push("/traceability")}
              >
                {current.testedBy}
              </dd>
            </div>
            <div>
              <dt>Requirement</dt>
              <dd
                className="link-value cursor-pointer"
                onClick={() => router.push(`/traceability?req=${current.requirement}`)}
              >
                {current.requirement}
              </dd>
            </div>
          </dl>

          <span className="section-label">CODE METRICS</span>
          <dl>
            <div>
              <dt>Lines of Code</dt>
              <dd>{current.loc} LOC</dd>
            </div>
            <div>
              <dt>Complexity</dt>
              <dd>{current.complexity}</dd>
            </div>
            <div>
              <dt>Last Modified</dt>
              <dd>{current.lastModified}</dd>
            </div>
            <div>
              <dt>Author</dt>
              <dd>{current.author}</dd>
            </div>
          </dl>

          <div className="coverage">
            <div>
              <span>Test coverage</span>
              <strong>{current.coverage}%</strong>
            </div>
            <div className="coverage-track">
              <i style={{ width: `${current.coverage}%` }} />
            </div>
          </div>
        </div>

        <div className="inspector-actions">
          <Link
            href={`/graph?entity=${encodeURIComponent(selected)}`}
            className="control primary-button"
          >
            <Icon name="code" size={14} />
            View Code
          </Link>
          <Link
            href="/impact"
            className="control small-button"
            title="Simulate blast radius"
          >
            <Icon name="sparkles" size={14} />
            Analyze Impact
          </Link>
        </div>
      </aside>

      {/* Bottom Triple Dock */}
      <div className="bottom-dock">
        {/* Panel 1: Code Preview */}
        <section className="bottom-panel code-panel">
          <div className="bottom-header">
            <div>
              <span className="eyebrow">CODE PREVIEW</span>
              <strong>{current.filePath.split("/").pop()}</strong>
              <span className="language">{current.language}</span>
            </div>
            <Link
              href={`/graph?entity=${encodeURIComponent(selected)}`}
              className="control flex items-center gap-1 hover:underline"
            >
              <span>Full View</span>
              <Icon name="arrow" size={13} />
            </Link>
          </div>

          <pre>
            <code>
              {current.codeLines.map((line) => (
                <span
                  key={line.num}
                  className={`line ${
                    line.isSelected ? "selected-line" : ""
                  } ${line.isFocus ? "focus-line" : ""}`}
                >
                  <i>{line.num}</i>
                  {line.code}
                </span>
              ))}
            </code>
          </pre>
        </section>

        {/* Panel 2: GraphTrace AI Reasoning */}
        <section className="bottom-panel ai-panel">
          <div className="bottom-header">
            <div>
              <span className="ai-mark">
                <Icon name="sparkles" size={14} />
              </span>
              <strong>GraphTrace AI</strong>
            </div>
            <button
              type="button"
              className={`control ${evidenceVisible ? "active-text" : ""}`}
              onClick={() => setEvidenceVisible(!evidenceVisible)}
            >
              {evidenceVisible ? "Hide Evidence" : "Show Evidence"}
            </button>
          </div>

          <p className="question">{current.aiQuestion}</p>
          <p className="answer">{current.aiAnswer}</p>

          {evidenceVisible && (
            <div className="evidence">
              <span>EVIDENCE · {current.evidenceLine}</span>
              <code>{current.evidenceCode}</code>
              <small>{current.filePath.split("/").pop()}</small>
            </div>
          )}
        </section>

        {/* Panel 3: Change Impact Analysis */}
        <section className="bottom-panel impact-panel">
          <div className="bottom-header">
            <strong>Impact Analysis</strong>
            <Link
              href="/impact"
              className="control text-blue-400 hover:text-blue-300"
            >
              Simulate Change
            </Link>
          </div>

          <div className="risk-row">
            <span>CHANGE RISK</span>
            <b>{current.risk}</b>
          </div>

          <div className="impact-grid">
            <div>
              <strong>{current.controllers}</strong>
              <span>Controllers</span>
            </div>
            <div>
              <strong>{current.apis}</strong>
              <span>APIs</span>
            </div>
            <div>
              <strong>{current.tests}</strong>
              <span>Tests</span>
            </div>
            <div>
              <strong>{current.reqs}</strong>
              <span>Requirement</span>
            </div>
          </div>

          <div className="impact-note">
            <Icon name="trace" size={14} />
            <span>{current.blastRadius} entities in potential blast radius</span>
          </div>
        </section>
      </div>
    </div>
  );
}
