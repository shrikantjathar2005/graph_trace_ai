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
  { icon: "layers", label: "Dependencies", href: "/graph?type=component,module" },
  { icon: "trace", label: "Traceability", href: "/traceability" },
  { icon: "sparkles", label: "Impact Analysis", href: "/impact" },
  { icon: "sparkles", label: "AI Assistant", href: "/chat" },
];

const navSecondary: NavItemConfig[] = [
  { icon: "file", label: "Files", href: "/graph?type=module" },
  { icon: "test", label: "Tests", href: "/traceability" },
  { icon: "book", label: "Documentation", href: "/ingest" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isItemActive = (item: NavItemConfig) => {
    if (item.href === "/") {
      return pathname === "/";
    }
    const cleanHref = item.href.split("?")[0];
    return pathname.startsWith(cleanHref);
  };

  const renderItem = (item: NavItemConfig) => {
    const active = isItemActive(item);
    return (
      <Link
        key={item.label}
        href={item.href}
        className={`control nav-item ${active ? "active" : ""}`}
      >
        <Icon name={item.icon} size={16} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="sidebar">
      <nav>
        {navPrimary.map(renderItem)}
        <div className="nav-rule" />
        {navSecondary.map(renderItem)}
      </nav>

      <div className="sidebar-bottom">
        <Link
          href="/ingest"
          className={`control nav-item ${pathname === "/ingest" ? "active" : ""}`}
        >
          <Icon name="plug" size={16} />
          <span className="flex-1 text-left">Integrations</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            alert("Settings: GraphTrace v1.0.0 — Apple Glassmorphism UI Active");
          }}
          className="control nav-item"
        >
          <Icon name="settings" size={16} />
          <span className="flex-1 text-left">Settings</span>
        </button>
      </div>
    </aside>
  );
}
