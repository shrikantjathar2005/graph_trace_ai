"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon, IconName } from "@/components/ui/Icons";

interface CommandItem {
  id: string;
  category: "NAVIGATE" | "SEARCH" | "ANALYZE";
  title: string;
  subtitle: string;
  icon: IconName;
  action: () => void;
}

export function CommandPalette({ close }: { close: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: CommandItem[] = useMemo(
    () => [
      {
        id: "nav-overview",
        category: "NAVIGATE",
        title: "Overview & System Architecture",
        subtitle: "Navigate to primary system overview",
        icon: "grid",
        action: () => {
          router.push("/");
          close();
        },
      },
      {
        id: "nav-map",
        category: "NAVIGATE",
        title: "Open Knowledge Graph Explorer",
        subtitle: "8-Tier AST DAG and trace visualization",
        icon: "map",
        action: () => {
          router.push("/graph");
          close();
        },
      },
      {
        id: "nav-trace",
        category: "NAVIGATE",
        title: "Traceability Matrix",
        subtitle: "Requirement to test coverage matrix",
        icon: "trace",
        action: () => {
          router.push("/traceability");
          close();
        },
      },
      {
        id: "nav-impact",
        category: "ANALYZE",
        title: "Analyze Impact & Blast Radius",
        subtitle: "Calculate change risk across 13 entities",
        icon: "sparkles",
        action: () => {
          router.push("/impact");
          close();
        },
      },
      {
        id: "nav-chat",
        category: "ANALYZE",
        title: "GraphTrace AI Assistant",
        subtitle: "Ask architecture & code questions with evidence",
        icon: "sparkles",
        action: () => {
          router.push("/chat");
          close();
        },
      },
      {
        id: "nav-ingest",
        category: "NAVIGATE",
        title: "Import / Ingest Artifacts",
        subtitle: "Add source code, SRS, and test suites",
        icon: "plug",
        action: () => {
          router.push("/ingest");
          close();
        },
      },
      {
        id: "theme-obsidian",
        category: "NAVIGATE",
        title: "Theme: Switch to Obsidian Blue",
        subtitle: "Minimal deep slate glassmorphism with blue accents",
        icon: "moon",
        action: () => {
          document.documentElement.setAttribute("data-theme", "obsidian");
          localStorage.setItem("graphtrace-theme", "obsidian");
          close();
        },
      },
      {
        id: "theme-gold",
        category: "ANALYZE",
        title: "Theme: Switch to Golden Rush",
        subtitle: "Luxurious champagne gold and amber glassmorphism",
        icon: "sparkles",
        action: () => {
          document.documentElement.setAttribute("data-theme", "golden-rush");
          localStorage.setItem("graphtrace-theme", "golden-rush");
          close();
        },
      },
      {
        id: "theme-monochrome",
        category: "NAVIGATE",
        title: "Theme: Switch to Minimal Monochrome",
        subtitle: "Pure black & white stark technical UI",
        icon: "box",
        action: () => {
          document.documentElement.setAttribute("data-theme", "monochrome");
          localStorage.setItem("graphtrace-theme", "monochrome");
          close();
        },
      },
      {
        id: "theme-github",
        category: "NAVIGATE",
        title: "Theme: Switch to GitHub Dark",
        subtitle: "GitHub Primer dark with code & commit tones",
        icon: "branch",
        action: () => {
          document.documentElement.setAttribute("data-theme", "github-dark");
          localStorage.setItem("graphtrace-theme", "github-dark");
          close();
        },
      },
      {
        id: "search-auth",
        category: "SEARCH",
        title: "AuthService.java",
        subtitle: "Service · src/main/java/com/acme/auth",
        icon: "box",
        action: () => {
          router.push("/graph?entity=Auth%20Service");
          close();
        },
      },
      {
        id: "search-gateway",
        category: "SEARCH",
        title: "APIGatewayController",
        subtitle: "API Gateway · 12 endpoints exposed",
        icon: "api",
        action: () => {
          router.push("/graph?entity=API%20Gateway");
          close();
        },
      },
      {
        id: "search-payment",
        category: "SEARCH",
        title: "PaymentService & Stripe",
        subtitle: "External integration · 4 dependants",
        icon: "external",
        action: () => {
          router.push("/graph?entity=Payment");
          close();
        },
      },
      {
        id: "search-req-auth",
        category: "SEARCH",
        title: "REQ-001: Multi-Factor Authentication",
        subtitle: "Requirement · VERIFIED by 3 test suites",
        icon: "trace",
        action: () => {
          router.push("/traceability?req=REQ-001");
          close();
        },
      },
    ],
    [router, close]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(0, filtered.length - 1) : prev - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, close]);

  const categories = ["SEARCH", "NAVIGATE", "ANALYZE"] as const;

  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="command-palette elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="command-input">
          <Icon name="search" size={19} />
          <input
            autoFocus
            placeholder="Search or run a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd onClick={close} className="cursor-pointer">
            ESC
          </kbd>
        </div>

        <div className="command-results">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = filtered.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;
              return (
                <div key={cat} className="mb-2">
                  <span className="section-label">{cat}</span>
                  {catItems.map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`control command-item ${
                          isSelected ? "active" : ""
                        }`}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <Icon name={item.icon} size={16} />
                        <span>
                          <b>{item.title}</b>
                          <small>{item.subtitle}</small>
                        </span>
                        {isSelected && <kbd>↵</kbd>}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="command-footer">
          <span>
            <kbd>↑↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Select
          </span>
          <span>
            <kbd>ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
