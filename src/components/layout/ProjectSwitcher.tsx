"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icons";
import { useProject } from "@/context/ProjectContext";
import { ProjectInfo } from "@/types/api";
import { defaultProjects } from "@/lib/graphStore";
import { Trash2, Plus, Sparkles, FolderGit2, Check } from "lucide-react";

export { defaultProjects };
export type { ProjectInfo };

interface ProjectSwitcherProps {
  close: () => void;
}

export function ProjectSwitcher({ close }: ProjectSwitcherProps) {
  const router = useRouter();
  const { currentProject, allProjects, selectProject, deleteProject } = useProject();
  const [search, setSearch] = useState("");

  const filtered = allProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.stack.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const importedProjects = filtered.filter((p) => !p.isSample);
  const sampleProjects = filtered.filter((p) => p.isSample);

  return (
    <>
      <div className="popover-backdrop" onClick={close} />
      <div
        className="project-popover elevated w-[420px] max-w-[95vw]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Project Switcher"
      >
        {/* Header */}
        <div className="popover-title flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div>
            <strong className="text-[var(--text-primary)] font-semibold text-sm block">
              Switch Project Workspace
            </strong>
            <span className="text-[11px] text-[var(--text-muted)]">
              Select an active repository knowledge graph
            </span>
          </div>
          <button
            type="button"
            className="control icon-button w-7 h-7 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={close}
            aria-label="Close project switcher"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="search-box my-3">
          <Icon name="search" size={13} />
          <input
            aria-label="Search projects..."
            placeholder="Search projects or technologies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Project Lists Container */}
        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
          {/* Section 1: User / Imported Projects */}
          <div>
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <FolderGit2 className="w-3 h-3 text-[var(--accent)]" />
                Imported Local Projects ({importedProjects.length})
              </span>
            </div>

            {importedProjects.length === 0 ? (
              <div className="px-3 py-2.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)]/30 text-center">
                <p className="text-[11px] text-[var(--text-muted)]">
                  No local repository imported yet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/ingest");
                    close();
                  }}
                  className="mt-1 text-[11px] text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" /> Import folder or files
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {importedProjects.map((p) => {
                  const isCurrent = p.id === currentProject.id;
                  return (
                    <div
                      key={p.id}
                      className={`group flex items-center justify-between p-2 rounded-lg border transition-all ${
                        isCurrent
                          ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--text-primary)]"
                          : "bg-[var(--surface-2)]/60 border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          selectProject(p);
                          close();
                        }}
                        className="flex-1 text-left flex items-start gap-2.5 min-w-0"
                      >
                        <span className="w-2 h-2 rounded-full bg-[var(--success)] shrink-0 mt-1.5 shadow-[0_0_6px_rgba(71,184,129,0.5)]" />
                        <div className="min-w-0">
                          <strong className="text-xs font-semibold block truncate text-[var(--text-primary)]">
                            {p.name}
                          </strong>
                          <span className="text-[10px] text-[var(--text-muted)] block truncate">
                            {p.branch} · {p.stack}
                            {p.counts?.files && ` · ${p.counts.files} files`}
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isCurrent && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)] font-semibold">
                            ACTIVE
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove imported project "${p.name}"?`)) {
                              deleteProject(p.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--danger)]/20 hover:text-[var(--danger)] text-[var(--text-muted)] transition-opacity"
                          title="Remove imported project"
                          aria-label="Remove imported project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Demonstration Sample Projects */}
          <div>
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Demonstration Sample Projects ({sampleProjects.length})
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {sampleProjects.map((p) => {
                const isCurrent = p.id === currentProject.id;
                const isReady = p.status === "completed";

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      selectProject(p);
                      close();
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left ${
                      isCurrent
                        ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--text-primary)]"
                        : "bg-[var(--surface-2)]/40 border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                          isReady ? "bg-amber-400" : "bg-zinc-600"
                        }`}
                      />
                      <div className="min-w-0">
                        <strong className="text-xs font-semibold block truncate text-[var(--text-primary)]">
                          {p.name}
                        </strong>
                        <span className="text-[10px] text-[var(--text-muted)] block truncate">
                          {p.branch} · {p.stack}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          isReady
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
                        }`}
                      >
                        {isReady ? "Sample Ready" : "Unindexed"}
                      </span>
                      {isCurrent && (
                        <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="popover-footer mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
          <button
            type="button"
            className="control text-[var(--accent)] hover:underline flex items-center gap-1 font-medium"
            onClick={() => {
              router.push("/ingest");
              close();
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Ingest Repository
          </button>
          <span className="text-[10px] text-[var(--text-muted)]">
            Active: <b>{currentProject.name}</b>
          </span>
        </div>
      </div>
    </>
  );
}
