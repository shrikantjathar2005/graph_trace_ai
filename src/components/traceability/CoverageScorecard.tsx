"use client";

import React from "react";
import { FileText, CheckCircle2, AlertCircle, HelpCircle, ShieldCheck, Activity } from "lucide-react";
import { TraceabilitySummaryStats } from "@/types/traceability";
import { Card, CardContent } from "@/components/ui/Card";

interface CoverageScorecardProps {
  summary: TraceabilitySummaryStats;
}

export function CoverageScorecard({ summary }: CoverageScorecardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
      {/* 1. Total Requirements */}
      <Card className="bg-zinc-900/60 border-zinc-800/80">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Total Requirements
            </span>
            <p className="text-xl font-bold font-mono text-zinc-100 mt-1">
              {summary.totalRequirements}
            </p>
          </div>
          <div className="p-2 rounded-md bg-amber-950/40 border border-amber-800/50 text-amber-400">
            <FileText className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Fully Covered */}
      <Card className="bg-zinc-900/60 border-zinc-800/80">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-wider">
              Fully Covered
            </span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {summary.fullyCovered}
            </p>
          </div>
          <div className="p-2 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Partially Covered */}
      <Card className="bg-zinc-900/60 border-zinc-800/80">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-amber-500/80 uppercase tracking-wider">
              Partially Covered
            </span>
            <p className="text-xl font-bold font-mono text-amber-400 mt-1">
              {summary.partiallyCovered}
            </p>
          </div>
          <div className="p-2 rounded-md bg-amber-950/40 border border-amber-800/50 text-amber-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Untested */}
      <Card className="bg-zinc-900/60 border-zinc-800/80">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-rose-500/80 uppercase tracking-wider">
              Untested
            </span>
            <p className="text-xl font-bold font-mono text-rose-400 mt-1">
              {summary.untested}
            </p>
          </div>
          <div className="p-2 rounded-md bg-rose-950/40 border border-rose-800/50 text-rose-400">
            <HelpCircle className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* 5. Deterministic Coverage % */}
      <Card className="col-span-2 md:col-span-1 bg-zinc-900/60 border-zinc-800/80">
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Full Coverage %
            </span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-cyan-300">
              {summary.coveragePercent}%
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {summary.fullyCovered}/{summary.totalRequirements} Verified
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${summary.coveragePercent}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
