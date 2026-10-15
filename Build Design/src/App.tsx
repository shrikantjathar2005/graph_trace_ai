import { useEffect, useState, type ReactNode } from "react";

type IconName =
  | "logo"
  | "grid"
  | "map"
  | "code"
  | "layers"
  | "trace"
  | "sparkles"
  | "file"
  | "test"
  | "book"
  | "plug"
  | "settings"
  | "search"
  | "chevron"
  | "branch"
  | "moon"
  | "refresh"
  | "bell"
  | "filter"
  | "more"
  | "maximize"
  | "box"
  | "api"
  | "database"
  | "external"
  | "arrow"
  | "close";

const iconPaths: Record<IconName, ReactNode> = {
  logo: <><path d="M16.5 6.8A7 7 0 1 0 18.2 15H12v-3h9v9h-3v-2.2" /><circle cx="7" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="17" cy="5" r="1" fill="currentColor" stroke="none" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  map: <><circle cx="5" cy="12" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="m7 11 10-4M7 13l10 4" /></>,
  code: <><path d="m9 18-6-6 6-6M15 6l6 6-6 6" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  trace: <><path d="M4 6h6v6h6v6h4" /><circle cx="4" cy="6" r="2" /><circle cx="20" cy="18" r="2" /></>,
  sparkles: <><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3ZM5 15l.7 2.3L8 18.5l-2.3 1.2L5 22l-.7-2.3L2 18.5l2.3-1.2L5 15Z" /></>,
  file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5" /></>,
  test: <><path d="M9 3v5l-5 9a3 3 0 0 0 2.6 4h10.8a3 3 0 0 0 2.6-4l-5-9V3M8 13h8" /></>,
  book: <><path d="M4 5a3 3 0 0 1 3-2h5v18H7a3 3 0 0 0-3 2V5ZM20 5a3 3 0 0 0-3-2h-5v18h5a3 3 0 0 1 3 2V5Z" /></>,
  plug: <><path d="m8 12 8-8M14 4l6 6M6 14l4 4M5 19l-2 2M10 9l5 5-4 4a3.5 3.5 0 0 1-5-5l4-4Z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  chevron: <path d="m8 10 4 4 4-4" />,
  branch: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="6" cy="19" r="2" /><path d="M6 7v10M8 12h4a6 6 0 0 0 6-4" /></>,
  moon: <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" />,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 8A7 7 0 0 1 18 6l2 6M18 16A7 7 0 0 1 6 18l-2-6" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  filter: <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  maximize: <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v9" /></>,
  api: <><path d="M8 9 4 12l4 3M16 9l4 3-4 3M14 5l-4 14" /></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></>,
  external: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  arrow: <path d="m5 12 14 0M14 7l5 5-5 5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
};

function Icon({ name, size = 17 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

function Control({ children, className = "", onClick, label }: { children: ReactNode; className?: string; onClick?: () => void; label?: string }) {
  return <button type="button" className={`control ${className}`} onClick={onClick} aria-label={label}>{children}</button>;
}

function SearchBox({ placeholder, onFocus }: { placeholder: string; onFocus?: () => void }) {
  return <div className="search-box"><Icon name="search" size={15} /><input aria-label={placeholder} placeholder={placeholder} onFocus={onFocus} /></div>;
}

const navPrimary: [IconName, string][] = [
  ["grid", "Overview"], ["map", "System Map"], ["code", "Codebase"], ["layers", "Dependencies"],
  ["trace", "Traceability"], ["sparkles", "Impact Analysis"], ["sparkles", "AI Assistant"],
];
const navSecondary: [IconName, string][] = [["file", "Files"], ["test", "Tests"], ["book", "Documentation"]];

function Sidebar({ active, setActive }: { active: string; setActive: (label: string) => void }) {
  const item = ([icon, label]: [IconName, string]) => (
    <Control key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => setActive(label)}>
      <Icon name={icon} /><span>{label}</span>
    </Control>
  );
  return <aside className="sidebar">
    <nav>{navPrimary.map(item)}<div className="nav-rule" />{navSecondary.map(item)}</nav>
    <div className="sidebar-bottom">{item(["plug", "Integrations"])}{item(["settings", "Settings"])}</div>
  </aside>;
}

function TopBar({ openProjects, openCommand }: { openProjects: () => void; openCommand: () => void }) {
  return <header className="topbar">
    <div className="window-controls" aria-label="Window controls">
      <span className="window-close" />
      <span className="window-minimize" />
      <span className="window-expand" />
    </div>
    <div className="brand"><span className="brand-mark"><Icon name="logo" size={23} /></span><span>GraphTrace <b>AI</b></span></div>
    <div className="repo-controls">
      <Control className="select-control" onClick={openProjects}><span className="repo-dot" />E-Commerce Platform<Icon name="chevron" size={14} /></Control>
      <Control className="select-control muted"><Icon name="branch" size={14} />main<Icon name="chevron" size={14} /></Control>
    </div>
    <Control className="global-search" onClick={openCommand}>
      <Icon name="search" size={16} /><span>Search classes, methods, APIs...</span><kbd>⌘ K</kbd>
    </Control>
    <div className="top-actions">
      <Control className="icon-button" label="Toggle theme"><Icon name="moon" /></Control>
      <Control className="icon-button sync" label="Sync repository"><Icon name="refresh" /></Control>
      <Control className="icon-button notification" label="Notifications"><Icon name="bell" /></Control>
      <Control className="avatar" label="Open profile">AM</Control>
    </div>
  </header>;
}

const kpis: [IconName, string, string][] = [
  ["box", "245", "Classes"], ["code", "1.2K", "Methods"], ["api", "48", "APIs"], ["test", "96", "Tests"], ["trace", "24", "Requirements"],
];

function KpiRow() {
  return <div className="kpi-row">{kpis.map(([icon, value, label]) => <div className="kpi-card" key={label}><span className="kpi-icon"><Icon name={icon} size={16} /></span><div><strong>{value}</strong><span>{label}</span></div></div>)}</div>;
}

type NodeName = "Frontend" | "API Gateway" | "Auth Service" | "Order Service" | "Payment" | "PostgreSQL";
const nodeMeta: Record<NodeName, [IconName, string]> = {
  Frontend: ["code", "React application"],
  "API Gateway": ["api", "12 endpoints"],
  "Auth Service": ["box", "Java service"],
  "Order Service": ["box", "Java service"],
  Payment: ["external", "Stripe integration"],
  PostgreSQL: ["database", "24 tables"],
};

function GraphNode({ name, selected, faded, onClick }: { name: NodeName; selected: boolean; faded: boolean; onClick: () => void }) {
  const [icon, meta] = nodeMeta[name];
  return <Control className={`graph-node node-${name.toLowerCase().replaceAll(" ", "-")} ${selected ? "selected" : ""} ${faded ? "faded" : ""}`} onClick={onClick}>
    <span className="node-icon"><Icon name={icon} size={16} /></span><span className="node-copy"><b>{name}</b><small>{meta}</small></span>
  </Control>;
}

function GraphCanvas({ selected, setSelected }: { selected: NodeName; setSelected: (node: NodeName) => void }) {
  const related: Record<NodeName, NodeName[]> = {
    Frontend: ["API Gateway"], "API Gateway": ["Frontend", "Auth Service", "Order Service", "Payment"],
    "Auth Service": ["API Gateway", "PostgreSQL"], "Order Service": ["API Gateway", "PostgreSQL"],
    Payment: ["API Gateway", "PostgreSQL"], PostgreSQL: ["Auth Service", "Order Service", "Payment"],
  };
  return <section className="graph-panel panel">
    <div className="panel-header graph-header">
      <div><h2>System Architecture Map</h2><p>Visualize the structure and relationships in your codebase</p></div>
      <div className="panel-actions"><SearchBox placeholder="Search in graph..." /><Control className="small-button"><Icon name="filter" size={14} />Filters</Control><Control className="icon-button" label="More options"><Icon name="more" /></Control></div>
    </div>
    <div className="graph-canvas">
      <svg className="edges" viewBox="0 0 800 390" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" /></marker></defs>
        <path className={selected === "Frontend" || selected === "API Gateway" ? "edge active" : "edge"} d="M400 65V108" />
        <path className={selected === "API Gateway" || selected === "Auth Service" ? "edge active" : "edge"} d="M400 165V190H190V225" />
        <path className={selected === "API Gateway" || selected === "Order Service" ? "edge active" : "edge"} d="M400 165V225" />
        <path className={selected === "API Gateway" || selected === "Payment" ? "edge active" : "edge"} d="M400 165V190H610V225" />
        <path className={selected === "Auth Service" || selected === "PostgreSQL" ? "edge active" : "edge"} d="M190 282V310H400V345" />
        <path className={selected === "Order Service" || selected === "PostgreSQL" ? "edge active" : "edge"} d="M400 282V345" />
        <path className={selected === "Payment" || selected === "PostgreSQL" ? "edge active" : "edge"} d="M610 282V310H400V345" />
      </svg>
      {(Object.keys(nodeMeta) as NodeName[]).map(name => <GraphNode key={name} name={name} selected={selected === name} faded={selected !== name && !related[selected].includes(name)} onClick={() => setSelected(name)} />)}
      <div className="zoom-controls"><Control label="Zoom in">+</Control><Control label="Reset zoom">1:1</Control><Control label="Zoom out">−</Control></div>
      <div className="graph-legend"><span><i className="legend-line solid" />Calls</span><span><i className="legend-line dashed" />Depends on</span><span><i className="legend-line active" />Active path</span></div>
    </div>
  </section>;
}

function ViewModes({ mode, setMode }: { mode: string; setMode: (mode: string) => void }) {
  return <div className="workspace-toolbar"><div><h1>System Map</h1><span className="live-status"><i />Repository synced 2 min ago</span></div><div className="mode-switch">{["Graph", "Blueprint", "Layers"].map(x => <Control key={x} className={mode === x ? "active" : ""} onClick={() => setMode(x)}>{x}</Control>)}<Control label="Fullscreen"><Icon name="maximize" size={15} /></Control></div></div>;
}

function Inspector({ selected }: { selected: NodeName }) {
  const [tab, setTab] = useState("Overview");
  const display = selected === "Auth Service" ? "AuthService" : selected.replaceAll(" ", "");
  return <aside className="inspector panel">
    <div className="inspector-title"><span className="large-node-icon"><Icon name={nodeMeta[selected][0]} size={20} /></span><div><h2>{display}</h2><span className="type-badge">{selected.includes("Service") ? "Service" : selected}</span></div><Control className="icon-button" label="More options"><Icon name="more" /></Control></div>
    <p className="file-path">src/main/java/com/acme/{display.toLowerCase()}/{display}.java</p>
    <div className="tabs">{["Overview", "Relations", "Code", "Tests"].map(x => <Control key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>{x}</Control>)}</div>
    <div className="inspector-content">
      <div className="section-label">RELATIONSHIPS</div>
      <dl><div><dt>Used by</dt><dd>3</dd></div><div><dt>Depends on</dt><dd>4</dd></div><div><dt>Tested by</dt><dd className="link-value">2 tests</dd></div><div><dt>Requirement</dt><dd className="link-value">AUTH-001</dd></div></dl>
      <div className="section-label">DETAILS</div>
      <dl><div><dt>Lines of Code</dt><dd>482</dd></div><div><dt>Complexity</dt><dd>Moderate</dd></div><div><dt>Last Modified</dt><dd>3 days ago</dd></div><div><dt>Author</dt><dd>A. Miller</dd></div></dl>
      <div className="coverage"><div><span>Test coverage</span><strong>87%</strong></div><div className="coverage-track"><i /></div></div>
    </div>
    <div className="inspector-actions"><Control className="primary-button"><Icon name="code" size={15} />View Code</Control><Control className="small-button"><Icon name="sparkles" size={15} />Analyze Impact</Control></div>
  </aside>;
}

function CodePreview() {
  return <section className="bottom-panel code-panel">
    <div className="bottom-header"><div><span className="eyebrow">CODE PREVIEW</span><strong>AuthService.java</strong><span className="language">JAVA</span></div><Control>View Code <Icon name="arrow" size={14} /></Control></div>
    <pre><code><span className="line"><i>48</i><em>public</em> String authenticate(Credentials credentials) {"{"}</span>
      <span className="line"><i>49</i>  User user = userRepository.find(credentials.email());</span>
      <span className="line selected-line"><i>50</i>  <em>if</em> (passwordEncoder.matches(credentials.password(), user.hash())) {"{"}</span>
      <span className="line focus-line"><i>51</i>    <em>return</em> jwtService.generateToken(user);</span>
      <span className="line"><i>52</i>  {"}"}</span><span className="line"><i>53</i>  <em>throw new</em> AuthenticationException();</span>
      <span className="line"><i>54</i>{"}"}</span></code></pre>
  </section>;
}

function AiPanel() {
  const [evidence, setEvidence] = useState(true);
  return <section className="bottom-panel ai-panel">
    <div className="bottom-header"><div><span className="ai-mark"><Icon name="sparkles" size={14} /></span><strong>GraphTrace AI</strong></div><Control className={evidence ? "active-text" : ""} onClick={() => setEvidence(!evidence)}>{evidence ? "Hide Evidence" : "Show Evidence"}</Control></div>
    <p className="question">Why does AuthService depend on JWTService?</p>
    <p className="answer">AuthService uses JWTService to generate signed access tokens after successful authentication.</p>
    {evidence && <div className="evidence"><span>EVIDENCE · LINE 51</span><code>jwtService.generateToken(user)</code><small>AuthService.java</small></div>}
  </section>;
}

function ImpactPanel() {
  return <section className="bottom-panel impact-panel">
    <div className="bottom-header"><strong>Impact Analysis</strong><Control>Simulate Change</Control></div>
    <div className="risk-row"><span>CHANGE RISK</span><b>MEDIUM</b></div>
    <div className="impact-grid"><div><strong>4</strong><span>Controllers</span></div><div><strong>2</strong><span>APIs</span></div><div><strong>6</strong><span>Tests</span></div><div><strong>1</strong><span>Requirement</span></div></div>
    <div className="impact-note"><Icon name="trace" size={15} /><span>13 entities in the potential blast radius</span></div>
  </section>;
}

function ProjectSwitcher({ close }: { close: () => void }) {
  const projects = [["E-Commerce Platform", "main · Java / React"], ["Payment Service", "main · Node / TypeScript"], ["AI Analytics", "develop · Python"]];
  return <><div className="popover-backdrop" onClick={close} /><div className="project-popover elevated">
    <div className="popover-title"><strong>Switch Project</strong><Control className="icon-button" onClick={close} label="Close"><Icon name="close" size={15} /></Control></div>
    <SearchBox placeholder="Search projects..." /><span className="section-label">RECENT</span>
    {projects.map((p, i) => <Control className={`project-option ${i === 0 ? "active" : ""}`} key={p[0]} onClick={close}><i /><span><b>{p[0]}</b><small>{p[1]}</small></span>{i === 0 && <span className="current-label">CURRENT</span>}</Control>)}
    <div className="popover-footer"><Control>+ Add Repository</Control><Control>Manage Projects</Control></div>
  </div></>;
}

function CommandPalette({ close }: { close: () => void }) {
  return <div className="modal-backdrop" onClick={close}><div className="command-palette elevated" onClick={e => e.stopPropagation()}>
    <div className="command-input"><Icon name="search" size={19} /><input autoFocus placeholder="Search or run a command..." /><kbd>ESC</kbd></div>
    <div className="command-results"><span className="section-label">SEARCH</span><Control className="command-item active"><Icon name="box" /><span><b>AuthService</b><small>Service · src/main/java/com/acme/auth</small></span><kbd>↵</kbd></Control>
      <span className="section-label">NAVIGATE</span><Control className="command-item"><Icon name="map" /><span><b>Open System Map</b><small>Navigate to architecture overview</small></span></Control>
      <span className="section-label">ANALYZE</span><Control className="command-item"><Icon name="sparkles" /><span><b>Analyze Impact</b><small>Calculate change blast radius</small></span></Control>
    </div>
    <div className="command-footer"><span><kbd>↑↓</kbd> Navigate</span><span><kbd>↵</kbd> Select</span><span><kbd>ESC</kbd> Close</span></div>
  </div></div>;
}

export default function App() {
  const [activeNav, setActiveNav] = useState("System Map");
  const [mode, setMode] = useState("Graph");
  const [selected, setSelected] = useState<NodeName>("Auth Service");
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); }
      if (event.key === "Escape") { setCommandOpen(false); setProjectsOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <div className="app-shell">
    <TopBar openProjects={() => setProjectsOpen(true)} openCommand={() => setCommandOpen(true)} />
    <Sidebar active={activeNav} setActive={setActiveNav} />
    <main className="workspace">
      <ViewModes mode={mode} setMode={setMode} />
      <KpiRow />
      <GraphCanvas selected={selected} setSelected={setSelected} />
    </main>
    <Inspector selected={selected} />
    <div className="bottom-dock"><CodePreview /><AiPanel /><ImpactPanel /></div>
    {projectsOpen && <ProjectSwitcher close={() => setProjectsOpen(false)} />}
    {commandOpen && <CommandPalette close={() => setCommandOpen(false)} />}
  </div>;
}
