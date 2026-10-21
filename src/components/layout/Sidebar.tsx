"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "@/components/ui/Icons";

interface NavItemConfig {
  icon: IconName;
  label: string;
  href: string;
  badge?: string;
}

const navPrimary: NavItemConfig[] = [
  { icon: "grid", label: "Overview", href: "/" },
  { icon: "map", label: "System Map", href: "/graph" },
  { icon: "code", label: "Codebase", href: "/graph?type=class,method" },
  { icon: "layers", label: "Dependencies", href: "/graph?view=dependencies" },
  { icon: "trace", label: "Traceability", href: "/traceability" },
  { icon: "sparkles", label: "Impact Analysis", href: "/impact" },
  { icon: "check", label: "Architecture Rules", href: "/rules" },
  { icon: "sparkles", label: "AI Assistant", href: "/chat" },
];

const navSecondary: NavItemConfig[] = [
  { icon: "file", label: "Files", href: "/graph?type=module" },
  { icon: "test", label: "Tests", href: "/traceability" },
  { icon: "book", label: "Documentation", href: "/ingest" },
];

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const isItemActive = (item: NavItemConfig) => {
    if (item.href === "/") {
      return pathname === "/";
    }
    const cleanHref = item.href.split("?")[0];
    return pathname.startsWith(cleanHref);
  };

  const renderItem = (item: NavItemConfig, isMobile = false) => {
    const active = isItemActive(item);
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => {
          if (isMobile && onCloseMobile) onCloseMobile();
        }}
        className={`control nav-item ${active ? "active" : ""}`}
        title={collapsed && !isMobile ? item.label : undefined}
        aria-label={item.label}
      >
        <Icon name={item.icon} size={16} />
        {(!collapsed || isMobile) && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-mono shrink-0">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop & Off-Canvas Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {mobileOpen && (
        <aside
          className="fixed inset-y-0 left-0 w-[240px] bg-[var(--surface-1)] z-50 md:hidden flex flex-col p-4 border-r border-[var(--border)] shadow-2xl animate-in slide-in-from-left duration-200"
          aria-label="Mobile Navigation"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2 font-semibold text-sm text-[var(--text-primary)]">
              <span className="brand-mark w-6 h-6 rounded-md flex items-center justify-center text-xs">
                <Icon name="logo" size={16} />
              </span>
              <span>GraphTrace <b className="text-[var(--accent)]">AI</b></span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="control icon-button w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              aria-label="Close mobile menu"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 overflow-y-auto flex-1">
            {navPrimary.map((item) => renderItem(item, true))}
            <div className="nav-rule" />
            {navSecondary.map((item) => renderItem(item, true))}
          </nav>

          <div className="sidebar-bottom pt-3 border-t border-[var(--border)] mt-auto">
            <Link
              href="/ingest"
              onClick={onCloseMobile}
              className={`control nav-item ${pathname === "/ingest" ? "active" : ""}`}
            >
              <Icon name="plug" size={16} />
              <span className="flex-1 text-left">Integrations</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                alert("Settings: GraphTrace v1.0.0 — Developer Dark Workspace");
                if (onCloseMobile) onCloseMobile();
              }}
              className="control nav-item"
            >
              <Icon name="settings" size={16} />
              <span className="flex-1 text-left">Settings</span>
            </button>
          </div>
        </aside>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`sidebar hidden md:flex ${collapsed ? "collapsed" : ""}`}
        aria-label="Main Navigation"
      >
        <nav className="flex-1">
          {navPrimary.map((item) => renderItem(item, false))}
          <div className="nav-rule" />
          {navSecondary.map((item) => renderItem(item, false))}
        </nav>

        <div className="sidebar-bottom">
          <Link
            href="/ingest"
            className={`control nav-item ${pathname === "/ingest" ? "active" : ""}`}
            title={collapsed ? "Integrations" : undefined}
          >
            <Icon name="plug" size={16} />
            {!collapsed && <span className="flex-1 text-left truncate">Integrations</span>}
          </Link>

          <button
            type="button"
            onClick={() => {
              alert("Settings: GraphTrace v1.0.0 — Developer Dark Workspace");
            }}
            className="control nav-item"
            title={collapsed ? "Settings" : undefined}
          >
            <Icon name="settings" size={16} />
            {!collapsed && <span className="flex-1 text-left truncate">Settings</span>}
          </button>

          {/* Sidebar Collapse Toggle Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="control nav-item mt-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title={collapsed ? "Expand sidebar (232px)" : "Collapse sidebar (64px)"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={15} />
              {!collapsed && (
                <span className="flex-1 text-left text-[11px] truncate">Collapse</span>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
