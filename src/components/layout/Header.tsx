"use client";

import React, { useState } from "react";
import {
  GitBranch,
  Search,
  CheckCircle2,
  Database,
  Cpu,
  FileCode2,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function Header() {
  const [useMock, setUseMock] = useState(true);

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Project selector & branch */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 hover:border-zinc-700 cursor-pointer transition-colors">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="font-medium">FinTrack Banking Core</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
          <span>main</span>
          <span className="text-zinc-600">@</span>
          <span className="text-zinc-400">d92e3a1</span>
        </div>

        <Badge variant="outline" size="sm" className="hidden md:inline-flex text-[10px]">
          284 Files Parsed
        </Badge>
      </div>

      {/* Center: Search Trigger */}
      <div className="hidden lg:flex items-center max-w-md w-72">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search entities, classes, tests, reqs... (⌘K)"
            className="w-full bg-zinc-900/70 border border-zinc-800 rounded-md pl-8 pr-12 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-600 font-sans"
            readOnly
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/60">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Subsystem Status Indicators & Mode */}
      <div className="flex items-center gap-3">
        {/* Module Health Pill Indicators */}
        <div className="hidden xl:flex items-center gap-3 border-r border-zinc-800/80 pr-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-zinc-400" title="M1: Artifact Intelligence (Krishna)">
            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>M1 AST</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400" title="M2: Neo4j Engine (Omkar)">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>M2 Neo4j</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400" title="M3: Reasoning & RAG (Rohit)">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>M3 RAG</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>
        </div>

        {/* Backend Mock/Live Toggle */}
        <button
          onClick={() => setUseMock(!useMock)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors cursor-pointer bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300"
          title="Toggle between Mock Layer and FastAPI connection"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>{useMock ? "MODE: MOCK" : "MODE: FASTAPI"}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>
      </div>
    </header>
  );
}
