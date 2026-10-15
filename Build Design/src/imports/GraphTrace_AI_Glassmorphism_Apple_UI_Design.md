# GraphTrace AI — Glassmorphism + Apple-Inspired UI Design System

**Status:** Final UI direction  
**Product:** GraphTrace AI  
**Design language:** Minimal technical + dark glassmorphism + Apple-inspired spatial hierarchy

## 1. Design Intent

GraphTrace AI is a developer-first software comprehension platform. The interface visualizes repositories as an interactive software system so developers can understand architecture, dependencies, relationships, code, tests, requirements, and change impact.

**Core principle:** Complex software should be visually understandable while the interface itself remains quiet.

The UI should feel **calm, premium, precise, technical, spatial, trustworthy, and intelligent** without looking like a generic AI chatbot.

Avoid cyberpunk neon, excessive glow, rainbow gradients, decorative 3D elements, excessive cards, excessive rounding, and unnecessary animation.

---

## 2. Visual Direction

The final direction combines:

- Apple-inspired product restraint
- Dark glass surfaces
- Minimal monochrome foundation
- Subtle cool gradients
- One dominant blue interaction accent
- Technical graph visualization
- Strong information hierarchy

Glass is used to create depth and hierarchy, not decoration.

---

## 3. Apple-Inspired Principles

### Clarity
Every visible element must have a clear purpose.

### Deference
The interface supports the software graph rather than competing with it.

### Depth
Use translucency, blur, layering, elevation, and motion to communicate hierarchy.

### Focus
Selection and active states must be immediately recognizable.

### Consistency
The same interaction model should apply to files, classes, methods, APIs, services, tests, requirements, documentation, and external services.

---

## 4. Global Layout

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                  │
├───────────────┬──────────────────────────────────────────┬───────────────┤
│   SIDEBAR     │           GRAPH WORKSPACE               │   INSPECTOR   │
│               │                                          │               │
│               │                                          │               │
├───────────────┴──────────────────────┬───────────────────┴───────────────┤
│             CODE PREVIEW             │      AI / IMPACT ANALYSIS         │
└──────────────────────────────────────┴───────────────────────────────────┘
```

Primary design target: **1536 × 864**.  
Desktop-first. Minimum comfortable width: approximately 1280px.

---

## 5. Background

Use a dark navy-black base with a very subtle cool atmospheric gradient.

```css
background:
  radial-gradient(circle at 20% 15%, rgba(70,110,170,0.10), transparent 32%),
  radial-gradient(circle at 80% 80%, rgba(60,100,160,0.07), transparent 35%),
  #0B0F14;
```

No visible photograph, illustration, strong blobs, or decorative texture.

---

## 6. Glassmorphism

### Standard glass

```css
background: rgba(255,255,255,0.07);
backdrop-filter: blur(20px) saturate(115%);
-webkit-backdrop-filter: blur(20px) saturate(115%);
border: 1px solid rgba(255,255,255,0.11);
box-shadow:
  0 8px 32px rgba(0,0,0,0.22),
  inset 0 1px 0 rgba(255,255,255,0.045);
```

### Elevated glass

```css
background: rgba(255,255,255,0.10);
backdrop-filter: blur(24px) saturate(120%);
-webkit-backdrop-filter: blur(24px) saturate(120%);
border: 1px solid rgba(255,255,255,0.15);
box-shadow:
  0 16px 48px rgba(0,0,0,0.28),
  inset 0 1px 0 rgba(255,255,255,0.06);
```

### Selected glass

```css
background: rgba(59,130,246,0.20);
border: 1px solid rgba(96,165,250,0.38);
box-shadow: 0 0 24px rgba(59,130,246,0.14);
```

Do not make every element glass.

---

## 7. Color System

```text
Background          #0B0F14
Surface             rgba(255,255,255,0.07)
Elevated Surface    rgba(255,255,255,0.10)

Text Primary        #F5F7FA
Text Secondary      #A8B0BB
Text Muted          #6F7885
Text Disabled       #4B5563

Border              rgba(255,255,255,0.11)
Border Strong       rgba(255,255,255,0.16)

Primary Blue        #3B82F6
Bright Blue         #60A5FA
Deep Blue           #2563EB

Success             #34D399
Warning             #FBBF24
Danger              #F87171
```

Blue is reserved for active navigation, selected nodes, focused controls, links, primary actions, and active graph paths.

Semantic colors should only communicate state.

---

## 8. Typography

Preferred:

```text
Inter
```

Fallback:

```text
Geist
system-ui
```

Code:

```text
JetBrains Mono
```

Hierarchy:

```text
Logo                 22–24px / 700
Page title           20–24px / 650
Section title        15–17px / 600
Panel title          14–16px / 600
Body                 13–14px / 400
Metadata             11–12px / 400
KPI number           24–30px / 650
KPI label            11–12px / 500
Code                 12–13px / 400
```

---

## 9. Spacing and Radius

Use a 4px base spacing grid:

```text
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48px
```

Typical panel padding: **16–20px**.

Corner radius:

```text
Small controls      8px
Inputs              10px
Buttons             9px
Cards               12px
Panels              14–16px
Modal               16–20px
```

Avoid making everything pill-shaped.

---

## 10. Top Bar

Persistent translucent glass navigation.

Left:

```text
[G] GraphTrace AI
```

Project context:

```text
[E-Commerce Platform ▾]
[main ▾]
```

Center:

```text
[ Search classes, methods, APIs... ] [⌘ K]
```

Right:

```text
Theme
Sync
Notifications
Avatar
```

The active repository must always be visible.

---

## 11. Project Switcher

The user can work on multiple repositories.

```text
Switch Project

[ Search projects... ]

RECENT

● E-Commerce Platform
  main · Java / React

○ Payment Service
  main · Node / TypeScript

○ AI Analytics
  develop · Python

────────────────────────

+ Add Repository
Manage Projects
```

The switcher is an elevated glass surface floating above the workspace and must not reflow the layout.

Switching projects must update graph, code, tests, requirements, documentation, AI context, and impact analysis.

---

## 12. Sidebar

Navigation:

```text
Overview
System Map
Codebase
Dependencies
Traceability
Impact Analysis
AI Assistant

Files
Tests
Documentation

Integrations
Settings
```

Active item:

- translucent blue fill
- blue border
- white icon
- white text
- restrained glow

---

## 13. KPI Row

Compact glass cards:

```text
245       Classes
1.2K      Methods
48        APIs
96        Tests
24        Requirements
```

Each contains a subtle icon, large number, and small label.

KPI cards remain secondary to the graph.

---

## 14. View Modes

```text
[ Graph ] [ Blueprint ] [ Layers ] [ Fullscreen ]
```

Graph is the default.

Blueprint emphasizes architecture.

Layers provides progressive abstraction:

```text
System
↓
Module
↓
Service
↓
Class
↓
Method
```

Fullscreen expands the graph.

Selected mode uses the blue glass treatment.

---

## 15. System Architecture Map

The graph is the visual centerpiece.

Header:

```text
System Architecture Map
Visualize the structure and relationships in your codebase
```

Controls:

```text
Search in graph...
Filters
More
```

Example:

```text
                    Frontend
                       │
                       ▼
                  API Gateway
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Auth Service  Order Service  Payment
          │            │            │
          └────────────┼────────────┘
                       ▼
                    Database
```

Nodes must support click, drag, hover, zoom, pan, and selection.

---

## 16. Graph Focus Behavior

When a node is selected:

```text
Selected             100%
Direct relations     100%
Related entities      70%
Unrelated entities    15–25%
```

The active path uses GraphTrace blue.

Unrelated entities fade rather than disappear.

---

## 17. Graph Node Language

First-class entities:

```text
Frontend
Service
API
Database
External
Test
Requirement
Documentation
```

Do not rely only on color. Use icons, labels, shape, relationship style, and metadata.

---

## 18. Relationship Language

Relationships:

```text
Calls
Depends on
Implements
Tested by
Documented by
```

Visual language:

```text
Calls          solid arrow
Depends on     dashed arrow
Implements     dotted/dashed
Tested by      dashed
Documented by  dashed
```

Blue indicates the active investigation path.

---

## 19. Node Inspector

Right-side elevated glass panel.

Example:

```text
AuthService

[Service]

src/main/java/com/acme/auth/AuthService.java
```

Tabs:

```text
Overview
Relations
Code
Tests
Requirements
```

Show:

```text
Used by             3
Depends on          4
Tested by            2
Requirement          1
Lines of Code      482
Last Modified   3 days ago
```

Actions:

```text
View Code
Analyze Impact
More
```

The inspector behaves like a contextual sheet floating above the graph.

---

## 20. Code Preview

Bottom-left panel:

```text
Code Preview
AuthService.java
Java
```

Use JetBrains Mono.

Support:

- syntax highlighting
- line numbers
- selected line
- clickable references
- View Code

Code surfaces must remain highly readable and should not become excessively translucent.

---

## 21. GraphTrace AI

Bottom-center panel:

```text
GraphTrace AI
[ Show Evidence ]
```

Example:

```text
Why does AuthService depend on JWTService?
```

Answer:

```text
AuthService depends on JWTService because it
uses JWTService to generate JWT tokens after
successful authentication.
```

Evidence:

```text
String token = jwtService.generateToken(user);

AuthService.java
line 52

[View in Code]
```

The UI should communicate:

**Graph → Evidence → AI interpretation**

AI must not visually overpower the graph.

---

## 22. Impact Analysis

Bottom-right:

```text
Impact Analysis
[ Simulate Change ]

Direct Impact
Indirect Impact
Test Impact
Requirement Impact
```

Example:

```text
4 Controllers affected
2 APIs affected
3 Services affected
6 Tests affected
1 Requirement affected
```

Risk:

```text
MEDIUM
```

Use semantic warning colors only where required.

---

## 23. Blast Radius

For:

> What breaks if I change this?

Visualize:

```text
Selected Method
       ↓
Direct Dependencies
       ↓
Indirect Dependencies
       ↓
Affected APIs
       ↓
Tests
       ↓
Requirements
       ↓
Documentation
```

Use blue for active propagation and semantic colors for risk.

---

## 24. Spatial Hierarchy

Visual depth should follow:

```text
Background
    ↓
Graph canvas
    ↓
Glass panels
    ↓
Elevated glass
    ↓
Selected entity
    ↓
Modal / command palette
```

Higher layers receive slightly stronger blur, opacity, border, and shadow.

---

## 25. Motion

Use Apple-like restraint.

```text
Micro interaction     150–200ms
Panel transition      200–300ms
Graph transition      300–450ms
```

Preferred:

- opacity
- transform
- blur
- scale
- gentle graph camera movement

Avoid bounce, excessive spring, constant glow, and decorative motion.

Respect `prefers-reduced-motion`.

---

## 26. Command Palette

Shortcut:

```text
⌘ K
```

Elevated glass panel:

```text
Search or run a command...

Search
  AuthService

Navigate
  Open System Map
  Open Dependencies

Analyze
  Analyze Impact
  Trace Dependency

Ask GraphTrace
  Where is authentication implemented?
```

---

## 27. Empty / Loading / Error States

### Empty

```text
No repository connected

Connect a Git repository to generate
your Software Knowledge Graph.

[ Add Repository ]
```

### Loading

```text
Analyzing repository...

✓ Repository connected
✓ Files discovered
✓ Architecture detected
✓ Dependencies extracted
◐ Building Knowledge Graph...
```

### Error

```text
Analysis could not be completed

GraphTrace couldn't analyze 14 files.

Possible causes:
• Unsupported syntax
• Missing dependency
• Invalid repository state

[ Retry Analysis ]
[ View Details ]
```

---

## 28. Accessibility

Glass must never reduce usability.

Requirements:

- readable contrast
- visible keyboard focus
- keyboard-accessible controls
- accessible icon labels
- graph entities with accessible names
- state not communicated by color alone
- reduced-motion support

---

## 29. Component Library

```text
AppShell
TopBar
ProjectSwitcher
BranchSwitcher
CommandPalette
Sidebar
NavItem
GlassPanel
GlassButton
KpiCard
ViewModeSwitcher
GraphCanvas
GraphNode
GraphEdge
GraphLegend
NodeInspector
InspectorTabs
CodePreview
AiPanel
EvidenceBlock
ImpactPanel
RiskIndicator
FilterButton
SearchInput
Dropdown
Tooltip
Modal
Toast
EmptyState
LoadingState
ErrorState
```

Reuse components instead of inventing page-specific variants.

---

## 30. Design Tokens

```css
:root {
  --bg: #0B0F14;

  --glass: rgba(255,255,255,0.07);
  --glass-elevated: rgba(255,255,255,0.10);
  --glass-selected: rgba(59,130,246,0.20);

  --text-primary: #F5F7FA;
  --text-secondary: #A8B0BB;
  --text-muted: #6F7885;

  --border: rgba(255,255,255,0.11);
  --border-strong: rgba(255,255,255,0.16);

  --primary: #3B82F6;
  --primary-bright: #60A5FA;
  --primary-deep: #2563EB;

  --success: #34D399;
  --warning: #FBBF24;
  --danger: #F87171;

  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;

  --blur-standard: 20px;
  --blur-elevated: 24px;

  --shadow-glass: 0 8px 32px rgba(0,0,0,0.22);
  --shadow-elevated: 0 16px 48px rgba(0,0,0,0.28);

  --font-sans: Inter, Geist, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

---

## 31. Logo Integration

The GraphTrace identity uses a geometric G/graph mark.

### Mark

Use for:

- favicon
- collapsed sidebar
- project icon
- AI identity
- loading screen

### Horizontal wordmark

Use for:

- top navigation
- login
- landing page
- documentation
- presentation

### Stacked logo

Use for:

- splash screen
- marketing sections
- presentation cover

The core logo must remain scalable and recognizable without relying on the glass background.

---

## 32. Frontend Recommendation

If the stack is not already fixed:

```text
React
TypeScript
Vite
Tailwind CSS or CSS Modules
Lucide
React Flow or equivalent graph library
Zustand or existing state solution
```

Suggested structure:

```text
src/
├── app/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── graph/
│   ├── inspector/
│   ├── code/
│   ├── ai/
│   └── impact/
├── features/
│   ├── projects/
│   ├── repositories/
│   ├── graph/
│   ├── traceability/
│   ├── impact/
│   └── assistant/
├── hooks/
├── stores/
├── lib/
├── types/
└── styles/
```

Preserve an existing architecture if the frontend is already underway.

---

## 33. AI Agent Rules

1. Treat this document as the visual source of truth.
2. Reuse design tokens.
3. Reuse components.
4. Do not invent arbitrary colors.
5. Do not add unnecessary gradients.
6. Do not make every element glass.
7. Keep the graph central.
8. Keep AI secondary to graph and evidence.
9. Preserve project context.
10. Keep code readable.
11. Implement interaction states, not just static mockups.
12. Implement loading, empty, error, hover, focus, and selected states.
13. Do not redesign the visual language without explicit approval.
14. Test desktop layouts against the 1536×864 reference composition.

---

## 34. Definition of Done

The UI is complete when:

- Glass surfaces have consistent blur, opacity, border, and shadow.
- Background remains subtle.
- Palette remains predominantly monochrome.
- Blue is reserved for interaction.
- Graph is visually dominant.
- Selected entities are immediately obvious.
- Inspector is easy to scan.
- Code is highly readable.
- AI evidence is distinct from AI interpretation.
- Impact analysis is understandable.
- Project switching is obvious.
- Typography and spacing are consistent.
- Motion is subtle.
- Accessibility is preserved.

---

## 35. Final Product Mental Model

```text
                 GRAPH TRACE AI

       ┌─────────────────────────────┐
       │       SOFTWARE GRAPH        │
       │                             │
       │ services · classes · APIs   │
       │       relationships         │
       └──────────────┬──────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
        CODE                   EVIDENCE
          │                       │
          └───────────┬───────────┘
                      ↓
                AI EXPLANATION
                      ↓
                IMPACT ANALYSIS
```

**Final principle:**

> The glass creates spatial hierarchy.  
> The monochrome foundation creates calm.  
> The blue accent creates focus.  
> The graph provides understanding.  
> The code provides evidence.  
> The AI explains.  
> The impact engine provides confidence.

GraphTrace AI should feel like a **premium engineering instrument for seeing how software fits together**.
