"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ProjectInfo } from "@/types/api";
import {
  getAllProjects,
  getActiveProjectId,
  setActiveProjectId,
  deleteImportedProject,
  clearAllImportedProjects,
  saveImportedProject,
  defaultProjects,
} from "@/lib/graphStore";
import { KnowledgeGraphData } from "@/types/graph";

interface ProjectContextValue {
  currentProject: ProjectInfo;
  allProjects: ProjectInfo[];
  selectProject: (project: ProjectInfo) => void;
  selectProjectById: (id: string) => void;
  refreshProjects: () => void;
  deleteProject: (id: string) => void;
  clearImported: () => void;
  saveNewProject: (
    project: ProjectInfo,
    graph: KnowledgeGraphData
  ) => { success: boolean; error?: string };
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [allProjects, setAllProjects] = useState<ProjectInfo[]>(defaultProjects);
  const [currentProject, setCurrentProject] = useState<ProjectInfo>(defaultProjects[0]);

  const refreshProjects = useCallback(() => {
    const list = getAllProjects();
    setAllProjects(list);
    const activeId = getActiveProjectId();
    const found = list.find((p) => p.id === activeId) || list[0];
    setCurrentProject(found);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => refreshProjects());
  }, [refreshProjects]);

  // Listen to external window events if fired from ingestion or other components
  useEffect(() => {
    const handler = () => {
      refreshProjects();
    };
    window.addEventListener("graphtrace:project-changed", handler);
    return () => window.removeEventListener("graphtrace:project-changed", handler);
  }, [refreshProjects]);

  const selectProject = useCallback((proj: ProjectInfo) => {
    setActiveProjectId(proj.id);
    setCurrentProject(proj);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("graphtrace:project-changed", { detail: proj }));
    }
  }, []);

  const selectProjectById = useCallback(
    (id: string) => {
      const list = getAllProjects();
      const found = list.find((p) => p.id === id);
      if (found) {
        selectProject(found);
      }
    },
    [selectProject]
  );

  const deleteProject = useCallback(
    (id: string) => {
      deleteImportedProject(id);
      refreshProjects();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("graphtrace:project-changed"));
      }
    },
    [refreshProjects]
  );

  const clearImported = useCallback(() => {
    clearAllImportedProjects();
    refreshProjects();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("graphtrace:project-changed"));
    }
  }, [refreshProjects]);

  const saveNewProject = useCallback(
    (project: ProjectInfo, graph: KnowledgeGraphData) => {
      const res = saveImportedProject(project, graph);
      if (res.success) {
        refreshProjects();
        selectProject(project);
      }
      return res;
    },
    [refreshProjects, selectProject]
  );

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        allProjects,
        selectProject,
        selectProjectById,
        refreshProjects,
        deleteProject,
        clearImported,
        saveNewProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return ctx;
}
