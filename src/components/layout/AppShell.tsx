"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { ProjectSwitcher, defaultProjects, ProjectInfo } from "./ProjectSwitcher";
import { CommandPalette } from "./CommandPalette";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [currentProject, setCurrentProject] = useState<ProjectInfo>(defaultProjects[0]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setProjectsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-shell">
      <TopBar
        currentProject={currentProject}
        openProjects={() => setProjectsOpen(true)}
        openCommand={() => setCommandOpen(true)}
      />
      <Sidebar />
      {children}
      {projectsOpen && (
        <ProjectSwitcher
          currentProject={currentProject}
          onSelectProject={(p) => setCurrentProject(p)}
          close={() => setProjectsOpen(false)}
        />
      )}
      {commandOpen && <CommandPalette close={() => setCommandOpen(false)} />}
    </div>
  );
}
