"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icons";

export interface ProjectInfo {
  id: string;
  name: string;
  branch: string;
  stack: string;
}

export const defaultProjects: ProjectInfo[] = [
  {
    id: "fintrack",
    name: "FinTrack Banking Core",
    branch: "main",
    stack: "Java / React / Neo4j",
  },
  {
    id: "ecommerce",
    name: "E-Commerce Platform",
    branch: "main",
    stack: "Java / Spring Boot",
  },
  {
    id: "payment",
    name: "Payment Gateway",
    branch: "develop",
    stack: "TypeScript / Node",
  },
  {
    id: "analytics",
    name: "AI Risk Analytics",
    branch: "main",
    stack: "Python / PyTorch",
  },
];

interface ProjectSwitcherProps {
  currentProject: ProjectInfo;
  onSelectProject: (proj: ProjectInfo) => void;
  close: () => void;
}

export function ProjectSwitcher({
  currentProject,
  onSelectProject,
  close,
}: ProjectSwitcherProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = defaultProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.stack.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="popover-backdrop" onClick={close} />
      <div className="project-popover elevated" onClick={(e) => e.stopPropagation()}>
        <div className="popover-title">
          <strong className="text-zinc-100 font-medium">Switch Project</strong>
          <button
            type="button"
            className="control icon-button"
            onClick={close}
            aria-label="Close"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="search-box">
          <Icon name="search" size={13} />
          <input
            aria-label="Search projects..."
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <span className="section-label">RECENT WORKSPACES</span>

        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
          {filtered.map((p) => {
            const isCurrent = p.id === currentProject.id;
            return (
              <button
                type="button"
                className={`control project-option ${isCurrent ? "active" : ""}`}
                key={p.id}
                onClick={() => {
                  onSelectProject(p);
                  close();
                }}
              >
                <i />
                <span className="text-left">
                  <b>{p.name}</b>
                  <small>
                    {p.branch} · {p.stack}
                  </small>
                </span>
                {isCurrent && <span className="current-label">CURRENT</span>}
              </button>
            );
          })}
        </div>

        <div className="popover-footer">
          <button
            type="button"
            className="control text-blue-400 hover:text-blue-300"
            onClick={() => {
              router.push("/ingest");
              close();
            }}
          >
            + Ingest Repository
          </button>
          <button
            type="button"
            className="control text-zinc-400 hover:text-zinc-200"
            onClick={close}
          >
            Manage Projects
          </button>
        </div>
      </div>
    </>
  );
}
