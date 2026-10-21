import type { KnowledgeGraphData } from "@/types/graph";
import type { ProjectInfo } from "@/types/api";

const PROJECTS_LIST_KEY = "graphtrace.imported-projects-list.v2";
const GRAPH_KEY_PREFIX = "graphtrace.imported-graph.v2.";
const ACTIVE_PROJECT_KEY = "graphtrace.active-project-id.v1";

// Legacy fallback keys for migration
const LEGACY_PROJECT_KEY = "graphtrace.imported-project.v1";
const LEGACY_GRAPH_KEY = "graphtrace.imported-graph.v1";

export const defaultProjects: ProjectInfo[] = [
  {
    id: "fintrack",
    name: "FinTrack Banking Core",
    branch: "main",
    stack: "Java / React / Neo4j",
    isSample: true,
    sourceType: "sample",
    status: "completed",
    description: "Built-in demonstration repository with 8-tier AST knowledge graph, requirement traceability, and blast radius model.",
    counts: {
      files: 28,
      requirements: 4,
      modules: 8,
      methods: 16,
      tests: 8,
      relationships: 28,
    },
  },
  {
    id: "ecommerce",
    name: "E-Commerce Platform",
    branch: "main",
    stack: "Java / Spring Boot",
    isSample: true,
    sourceType: "sample",
    status: "not_indexed",
    description: "Sample e-commerce microservices repository. Demonstrates an unindexed project state.",
  },
  {
    id: "payment",
    name: "Payment Gateway",
    branch: "develop",
    stack: "TypeScript / Node",
    isSample: true,
    sourceType: "sample",
    status: "not_indexed",
    description: "Sample payment service repository. Demonstrates an unindexed project state.",
  },
  {
    id: "analytics",
    name: "AI Risk Analytics",
    branch: "main",
    stack: "Python / PyTorch",
    isSample: true,
    sourceType: "sample",
    status: "not_indexed",
    description: "Sample Python data-science repository. Demonstrates an unindexed project state.",
  },
];

export function getAllImportedProjects(): ProjectInfo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ProjectInfo[];
    }
    // Migration: check legacy single project key
    const legacy = localStorage.getItem(LEGACY_PROJECT_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy) as ProjectInfo;
      if (parsedLegacy && parsedLegacy.id) {
        const legacyGraph = localStorage.getItem(LEGACY_GRAPH_KEY);
        if (legacyGraph) {
          localStorage.setItem(GRAPH_KEY_PREFIX + parsedLegacy.id, legacyGraph);
        }
        localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify([parsedLegacy]));
        return [parsedLegacy];
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function saveImportedProject(
  project: ProjectInfo,
  graph: KnowledgeGraphData
): {
  success: boolean;
  error?: string;
  isQuotaError?: boolean;
  rollbackFailed?: boolean;
} {
  if (typeof window === "undefined") {
    return { success: false, error: "Window is undefined (SSR environment)" };
  }
  if (!project || !project.id) {
    return { success: false, error: "Invalid project metadata: missing project ID." };
  }
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return { success: false, error: "Invalid graph structure: nodes and edges arrays required." };
  }

  const graphKey = GRAPH_KEY_PREFIX + project.id;

  // 1. Snapshot prior values BEFORE any writes to allow clean rollback
  const previousGraphRaw = localStorage.getItem(graphKey);
  const hadPreviousGraph = previousGraphRaw !== null;
  const previousListRaw = localStorage.getItem(PROJECTS_LIST_KEY);
  const hadPreviousList = previousListRaw !== null;
  const previousActiveId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  const hadPreviousActiveId = previousActiveId !== null;

  let graphWritten = false;
  let listWritten = false;

  try {
    const graphSerialized = JSON.stringify(graph);
    const existingList = getAllImportedProjects();
    const updatedList = [
      project,
      ...existingList.filter((p) => p.id !== project.id),
    ];
    const listSerialized = JSON.stringify(updatedList);

    // Step 1: Write graph data first
    localStorage.setItem(graphKey, graphSerialized);
    graphWritten = true;

    // Step 2: Write project list
    localStorage.setItem(PROJECTS_LIST_KEY, listSerialized);
    listWritten = true;

    // Step 3: Write active project ID
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);

    return { success: true };
  } catch (err) {
    // Rollback phase: Restore existing state or purge newly created keys
    let rollbackSucceeded = true;
    const rollbackFailures: string[] = [];

    // 1. Rollback graph:
    // If it existed before, restore the original graph! Only remove key if it did not exist before!
    if (graphWritten) {
      try {
        if (hadPreviousGraph) {
          localStorage.setItem(graphKey, previousGraphRaw!);
        } else {
          localStorage.removeItem(graphKey);
        }
      } catch {
        rollbackSucceeded = false;
        rollbackFailures.push("graph restoration");
      }
    }

    // 2. Rollback project list:
    if (listWritten) {
      try {
        if (hadPreviousList) {
          localStorage.setItem(PROJECTS_LIST_KEY, previousListRaw!);
        } else {
          localStorage.removeItem(PROJECTS_LIST_KEY);
        }
      } catch {
        rollbackSucceeded = false;
        rollbackFailures.push("project list restoration");
      }
    }

    // 3. Rollback active project ID:
    try {
      if (hadPreviousActiveId) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, previousActiveId!);
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
      }
    } catch {
      rollbackSucceeded = false;
      rollbackFailures.push("active project selection restoration");
    }

    console.error("Failed to save imported project to localStorage:", err);

    const isQuota =
      err instanceof Error &&
      (err.name === "QuotaExceededError" ||
        (err as { code?: number }).code === 22 ||
        (err as { code?: number }).code === 1014 ||
        err.message?.toLowerCase().includes("quota"));

    const baseMessage = isQuota
      ? "Browser storage quota exceeded. The knowledge graph is too large for local browser storage."
      : err instanceof Error
      ? err.message
      : "Failed to persist project knowledge graph to browser storage.";

    if (rollbackSucceeded) {
      return {
        success: false,
        isQuotaError: isQuota,
        rollbackFailed: false,
        error: `${baseMessage} (Prior state restored safely).`,
      };
    } else {
      return {
        success: false,
        isQuotaError: isQuota,
        rollbackFailed: true,
        error: `${baseMessage} (Warning: rollback partially failed during ${rollbackFailures.join(", ")}).`,
      };
    }
  }
}

export function getImportedGraph(projectId?: string): KnowledgeGraphData | null {
  if (typeof window === "undefined") return null;
  try {
    const targetId = projectId || getActiveProjectId();
    if (!targetId || targetId === "fintrack") return null;

    // 1. Try project-specific key
    const key = GRAPH_KEY_PREFIX + targetId;
    let raw = localStorage.getItem(key);

    // 2. Fallback to legacy key if targetId matches legacy project
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_PROJECT_KEY);
      if (legacyRaw) {
        try {
          const legacyObj = JSON.parse(legacyRaw);
          if (legacyObj.id === targetId) {
            raw = localStorage.getItem(LEGACY_GRAPH_KEY);
          }
        } catch {
          // ignore
        }
      }
    }

    if (!raw) return null;
    const graph = JSON.parse(raw) as KnowledgeGraphData;
    return graph && Array.isArray(graph.nodes) && Array.isArray(graph.edges) ? graph : null;
  } catch {
    return null;
  }
}

export function getImportedProject(projectId?: string): ProjectInfo | null {
  const all = getAllImportedProjects();
  if (projectId) {
    return all.find((p) => p.id === projectId) ?? null;
  }
  const activeId = getActiveProjectId();
  if (activeId.startsWith("imported")) {
    const active = all.find((p) => p.id === activeId);
    if (active) return active;
  }
  return all[0] ?? null;
}

export function deleteImportedProject(id: string): void {
  if (typeof window === "undefined") return;
  try {
    // 1. Remove graph data for this specific project
    localStorage.removeItem(GRAPH_KEY_PREFIX + id);

    // 2. Remove from imported list
    const currentList = getAllImportedProjects();
    const updatedList = currentList.filter((p) => p.id !== id);
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(updatedList));

    // Also clean up legacy keys if this was the legacy project
    try {
      const legacy = localStorage.getItem(LEGACY_PROJECT_KEY);
      if (legacy && JSON.parse(legacy)?.id === id) {
        localStorage.removeItem(LEGACY_PROJECT_KEY);
        localStorage.removeItem(LEGACY_GRAPH_KEY);
      }
    } catch {
      // ignore
    }

    // 3. If deleted project was active, switch to next available project
    if (localStorage.getItem(ACTIVE_PROJECT_KEY) === id) {
      const nextId = updatedList[0]?.id || "fintrack";
      localStorage.setItem(ACTIVE_PROJECT_KEY, nextId);
    }
  } catch (err) {
    console.error("Failed to delete imported project:", err);
  }
}

export function clearAllImportedProjects(): void {
  if (typeof window === "undefined") return;
  try {
    const all = getAllImportedProjects();
    for (const p of all) {
      localStorage.removeItem(GRAPH_KEY_PREFIX + p.id);
    }
    localStorage.removeItem(PROJECTS_LIST_KEY);
    localStorage.removeItem(LEGACY_GRAPH_KEY);
    localStorage.removeItem(LEGACY_PROJECT_KEY);
    if (localStorage.getItem(ACTIVE_PROJECT_KEY)?.startsWith("imported")) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, "fintrack");
    }
  } catch (err) {
    console.error("Failed to clear imported projects:", err);
  }
}

export function getActiveProjectId(): string {
  if (typeof window === "undefined") return "fintrack";
  try {
    const val = localStorage.getItem(ACTIVE_PROJECT_KEY);
    return val || "fintrack";
  } catch {
    return "fintrack";
  }
}

export function setActiveProjectId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch (err) {
    console.error("Failed to set active project id:", err);
  }
}

export function getAllProjects(): ProjectInfo[] {
  const importedList = getAllImportedProjects();
  return [...importedList, ...defaultProjects];
}

export function getProjectById(id: string): ProjectInfo | null {
  const all = getAllProjects();
  return all.find((p) => p.id === id) || null;
}
