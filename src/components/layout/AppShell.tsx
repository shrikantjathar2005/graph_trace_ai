"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { CommandPalette } from "./CommandPalette";
import { ProjectProvider, useProject } from "@/context/ProjectContext";

interface AppShellProps {
  children: React.ReactNode;
}

function InnerAppShell({ children }: AppShellProps) {
  const { currentProject } = useProject();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("graphtrace-sidebar-collapsed");
      if (saved !== null) {
        const val = saved === "true";
        requestAnimationFrame(() => setSidebarCollapsed(val));
      }
    } catch {}
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("graphtrace-sidebar-collapsed", String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setProjectsOpen(false);
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-shell flex flex-col w-full h-screen min-h-screen">
      <TopBar
        currentProject={currentProject}
        openProjects={() => setProjectsOpen(true)}
        openCommand={() => setCommandOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        isSidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
      />
      <div className="app-body flex flex-1 min-h-0 min-w-0 relative overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <main className="app-content-area flex-1 min-w-0 h-full overflow-hidden flex flex-col">
          {children}
        </main>
      </div>

      {projectsOpen && <ProjectSwitcher close={() => setProjectsOpen(false)} />}
      {commandOpen && <CommandPalette close={() => setCommandOpen(false)} />}
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ProjectProvider>
      <InnerAppShell>{children}</InnerAppShell>
    </ProjectProvider>
  );
}
