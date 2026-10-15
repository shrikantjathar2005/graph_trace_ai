"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Icon, IconName } from "@/components/ui/Icons";
import { ProjectInfo } from "./ProjectSwitcher";

export type ThemeId = "obsidian" | "golden-rush" | "monochrome" | "github-dark";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  icon: IconName;
  swatchGradient: string;
  accentColor: string;
}

export const themes: ThemeOption[] = [
  {
    id: "obsidian",
    name: "Obsidian Blue",
    description: "Apple dark glass with cobalt blue accents",
    icon: "moon",
    swatchGradient: "linear-gradient(135deg, #0b0f14 45%, #3b82f6 100%)",
    accentColor: "#3b82f6",
  },
  {
    id: "golden-rush",
    name: "Golden Rush",
    description: "Warm champagne gold & amber glassmorphism",
    icon: "sparkles",
    swatchGradient: "linear-gradient(135deg, #16120b 45%, #f59e0b 100%)",
    accentColor: "#f59e0b",
  },
  {
    id: "monochrome",
    name: "Minimal Monochrome",
    description: "Pure black & white stark technical UI",
    icon: "box",
    swatchGradient: "linear-gradient(135deg, #000000 45%, #ffffff 100%)",
    accentColor: "#ffffff",
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    description: "Primer dark with commit green & cyan blue",
    icon: "branch",
    swatchGradient: "linear-gradient(135deg, #0d1117 40%, #238636 75%, #58a6ff 100%)",
    accentColor: "#58a6ff",
  },
];

interface TopBarProps {
  currentProject: ProjectInfo;
  openProjects: () => void;
  openCommand: () => void;
}

export function TopBar({
  currentProject,
  openProjects,
  openCommand,
}: TopBarProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedRecently, setSyncedRecently] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("obsidian");
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("graphtrace-theme") as ThemeId | null;
    if (saved && themes.some((t) => t.id === saved)) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const handleSelectTheme = (newTheme: ThemeId) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("graphtrace-theme", newTheme);
    setThemeDropdownOpen(false);
  };

  const currentThemeConfig = themes.find((t) => t.id === theme) || themes[0];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncedRecently(true);
      setTimeout(() => setSyncedRecently(false), 3000);
    }, 800);
  };

  return (
    <header className="topbar">
      {/* macOS Window Controls */}
      <div className="window-controls" aria-label="Window controls">
        <span className="window-close" title="Close" />
        <span className="window-minimize" title="Minimize" />
        <span className="window-expand" title="Expand" />
      </div>

      {/* Brand */}
      <Link href="/" className="brand">
        <span className="brand-mark">
          <Icon name="logo" size={23} />
        </span>
        <span>
          GraphTrace <b>AI</b>
        </span>
      </Link>

      {/* Repo Controls */}
      <div className="repo-controls">
        <button
          type="button"
          className="control select-control"
          onClick={openProjects}
          title="Click to switch repository"
        >
          <span className="repo-dot" />
          <span>{currentProject.name}</span>
          <Icon name="chevron" size={14} />
        </button>

        <button
          type="button"
          className="control select-control muted"
          title="Git branch"
        >
          <Icon name="branch" size={14} />
          <span>{currentProject.branch}</span>
          <Icon name="chevron" size={14} />
        </button>
      </div>

      {/* Global Search Bar (⌘ K) */}
      <button
        type="button"
        className="control global-search"
        onClick={openCommand}
        aria-label="Open command palette"
      >
        <Icon name="search" size={16} />
        <span>Search classes, methods, APIs, tests...</span>
        <kbd>⌘ K</kbd>
      </button>

      {/* Top Right Actions */}
      <div className="top-actions">
        {/* Theme Dropdown Selector */}
        <div className="relative">
          <button
            type="button"
            className="control select-control gap-2 px-2.5 h-[34px] text-[11px] font-medium transition-all"
            onClick={() => setThemeDropdownOpen((prev) => !prev)}
            aria-label="Theme selector"
            title={`Current Theme: ${currentThemeConfig.name} — Click to switch`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-colors duration-300"
              style={{ background: currentThemeConfig.accentColor }}
            />
            <span className="hidden md:inline">{currentThemeConfig.name}</span>
            <Icon
              name="chevron"
              size={12}
              className={
                themeDropdownOpen
                  ? "rotate-180 transition-transform duration-200"
                  : "transition-transform duration-200"
              }
            />
          </button>

          {themeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setThemeDropdownOpen(false)}
              />
              <div className="theme-dropdown elevated z-50">
                <div className="theme-dropdown-header">
                  <span>APPEARANCE & THEME</span>
                  <button
                    type="button"
                    className="control icon-button w-5 h-5"
                    onClick={() => setThemeDropdownOpen(false)}
                    aria-label="Close theme dropdown"
                  >
                    <Icon name="close" size={11} />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {themes.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`theme-option ${isSelected ? "active" : ""}`}
                        onClick={() => handleSelectTheme(t.id)}
                      >
                        <div
                          className="theme-swatch"
                          style={{ background: t.swatchGradient }}
                        >
                          <Icon name={t.icon} size={13} className="text-white drop-shadow" />
                        </div>
                        <div className="theme-info">
                          <strong>{t.name}</strong>
                          <span>{t.description}</span>
                        </div>
                        {isSelected && (
                          <span className="text-white ml-auto flex items-center shrink-0">
                            <Icon name="check" size={13} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          className={`control icon-button sync ${
            isSyncing ? "animate-spin text-blue-400" : ""
          }`}
          onClick={handleSync}
          aria-label="Sync repository"
          title={syncedRecently ? "Repository in sync!" : "Sync repository"}
        >
          <Icon name="refresh" size={16} />
        </button>

        <button
          type="button"
          className="control icon-button notification"
          aria-label="Notifications"
          title="Notifications (1 unread impact alert)"
          onClick={() => {
            alert("GraphTrace AI: 13 entities impacted in latest commit to PaymentService.");
          }}
        >
          <Icon name="bell" size={16} />
        </button>

        <button
          type="button"
          className="control avatar"
          aria-label="Open profile"
          title="User: Alex Miller (Lead Architect)"
        >
          AM
        </button>
      </div>
    </header>
  );
}
