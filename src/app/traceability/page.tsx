"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { CoverageScorecard } from "@/components/traceability/CoverageScorecard";
import { RequirementList } from "@/components/traceability/RequirementList";
import { TraceabilityChain } from "@/components/traceability/TraceabilityChain";
import { TraceabilityInspector } from "@/components/traceability/TraceabilityInspector";
import { TraceabilityMatrixTable } from "@/components/traceability/TraceabilityMatrixTable";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/api";
import { TraceabilityMatrixRow, TraceabilitySummaryStats } from "@/types/traceability";
import { resolveTraceabilityEntity } from "@/lib/traceabilityEngine";
import { AnyTraceEntity } from "@/types/entities";
import { useProject } from "@/context/ProjectContext";
import { Network, FolderInput, Sparkles, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AnalysisWorkspaceNav } from "@/components/layout/AnalysisWorkspaceNav";

function TraceabilityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityParam = searchParams.get("entity") || searchParams.get("req");
  const { currentProject, selectProjectById } = useProject();

  const [data, setData] = useState<{
    rows: TraceabilityMatrixRow[];
    summary: TraceabilitySummaryStats;
  } | null>(null);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<AnyTraceEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getTraceabilityMatrix(currentProject.id);
      if (res.success) {
        setData(res.data);
        if (res.data.rows.length > 0) {
          const resolved = entityParam ? resolveTraceabilityEntity(entityParam, res.data.rows) : null;
          if (resolved) {
            setSelectedReqId(resolved.row.requirement.id);
            setSelectedEntity(resolved.entity);
          } else {
            setSelectedReqId(res.data.rows[0].requirement.id);
            setSelectedEntity(res.data.rows[0].requirement);
          }
        } else {
          setSelectedReqId(null);
          setSelectedEntity(null);
        }
      } else {
        setError("Failed to fetch requirement traceability data.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading traceability data");
    } finally {
      setLoading(false);
    }
  }, [currentProject.id, entityParam]);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (!ignore) loadData();
    });
    return () => { ignore = true; };
  }, [loadData]);

  // Re-resolve when entityParam changes dynamically while data is already loaded
  useEffect(() => {
    if (!data || !entityParam) return;
    const resolved = resolveTraceabilityEntity(entityParam, data.rows);
    if (resolved) {
      queueMicrotask(() => {
        setSelectedReqId(resolved.row.requirement.id);
        setSelectedEntity(resolved.entity);
      });
    }
  }, [entityParam, data]);


  const currentRow = data?.rows.find((r) => r.requirement.id === selectedReqId) || null;

  const handleSelectRequirement = (reqId: string) => {
    setSelectedReqId(reqId);
    const matched = data?.rows.find((r) => r.requirement.id === reqId);
    if (matched) {
      setSelectedEntity(matched.requirement);
    }
  };

  const handleSelectEntity = (entity: AnyTraceEntity) => {
    setSelectedEntity(entity);
  };

  const handleResetToRequirement = () => {
    if (currentRow) {
      setSelectedEntity(currentRow.requirement);
    }
  };

  const isEmpty = !loading && data && data.rows.length === 0;

  return (
    <PageContainer
      title="Requirement Traceability Matrix"
      description={
        currentProject.isSample
          ? `End-to-end traceability chain connecting requirements to implementation modules, tests, and documentation for ${currentProject.name} (Demonstration Model).`
          : `Traceability verification for ${currentProject.name} derived from parsed repository artifacts and requirement codes.`
      }
      badge={
        <Badge variant={currentProject.isSample ? "outline" : "success"}>
          {currentProject.isSample ? "Sample Model" : "Imported Workspace"}
        </Badge>
      }
      breadcrumbs={[{ label: currentProject.name }, { label: "Traceability Matrix" }]}
      actions={
        <Button
          size="xs"
          variant="outline"
          onClick={loadData}
          icon={<RefreshCw className="w-3 h-3" />}
        >
          Refresh Data
        </Button>
      }
    >
      {error && <ErrorBanner message={error} onRetry={loadData} className="mb-4" />}

      {/* 4-Perspective Workspace Navigation */}
      <AnalysisWorkspaceNav currentEntityId={selectedEntity?.id || selectedReqId || entityParam} className="mb-4 rounded-lg" />

      {entityParam && data && !data.rows.some((r) => r.requirement.id.toLowerCase() === entityParam.toLowerCase() || r.modules.some((m) => m.id.toLowerCase() === entityParam.toLowerCase()) || r.classes.some((c) => c.id.toLowerCase() === entityParam.toLowerCase()) || r.methods.some((m) => m.id.toLowerCase() === entityParam.toLowerCase()) || r.tests.some((t) => t.id.toLowerCase() === entityParam.toLowerCase())) && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-amber-900/40 bg-amber-950/20 text-xs font-mono text-amber-300 mb-4">
          <span>Artifact &apos;{entityParam}&apos; has no direct requirement mappings in {currentProject.name}.</span>
          <Link href={`/graph?entity=${encodeURIComponent(entityParam)}`} className="text-[#25C4B4] hover:underline flex items-center gap-1 font-semibold">
            Inspect in Knowledge Graph →
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[600px]">
              <Skeleton className="lg:col-span-3 h-full rounded-xl" />
              <Skeleton className="lg:col-span-6 h-full rounded-xl" />
              <Skeleton className="lg:col-span-3 h-full rounded-xl" />
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-4 shadow-sm">
              <Network className="w-7 h-7" />
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              No Traceability Records for {currentProject.name}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 mb-5 leading-relaxed">
              {currentProject.isSample
                ? "This sample project does not have requirement documents indexed. Explore FinTrack Banking Core to inspect reference traceability chains."
                : "No requirement specifications (REQ-...) were detected in the imported project. Include markdown documentation (e.g. SRS.md) containing 'REQ-001: Description' format to generate traceability links."}
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                variant="primary"
                onClick={() => router.push("/ingest")}
                icon={<FolderInput className="w-3.5 h-3.5" />}
              >
                Import Artifacts
              </Button>
              {currentProject.id !== "fintrack" && (
                <Button
                  variant="outline"
                  onClick={() => selectProjectById("fintrack")}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Switch to FinTrack Sample
                </Button>
              )}
            </div>
          </div>
        ) : data ? (
          <>
            {/* TOP: Aggregated Coverage Scorecard */}
            <CoverageScorecard summary={data.summary} />

            {/* 3-Column Main Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px] max-h-[720px]">
              {/* LEFT: Requirement Explorer (3 cols) */}
              <div className="lg:col-span-3 h-full">
                <RequirementList
                  rows={data.rows}
                  selectedReqId={selectedReqId}
                  onSelectRequirement={handleSelectRequirement}
                />
              </div>

              {/* CENTER: Traceability Path / Chain (6 cols) */}
              <div className="lg:col-span-6 h-full">
                <TraceabilityChain
                  row={currentRow}
                  selectedEntity={selectedEntity}
                  onSelectEntity={handleSelectEntity}
                />
              </div>

              {/* RIGHT: Requirement & Artifact Inspector (3 cols) */}
              <div className="lg:col-span-3 h-full">
                <TraceabilityInspector
                  row={currentRow}
                  selectedEntity={selectedEntity}
                  onResetToRequirement={handleResetToRequirement}
                  onSelectEntity={handleSelectEntity}
                />
              </div>
            </div>

            {/* BOTTOM: Compact Matrix Table */}
            <div className="pt-2">
              <TraceabilityMatrixTable
                rows={data.rows}
                selectedReqId={selectedReqId}
                onSelectRequirement={handleSelectRequirement}
              />
            </div>
          </>
        ) : null}
      </div>
    </PageContainer>
  );
}


export default function TraceabilityPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-zinc-500">Loading analysis perspectives...</div>}>
      <TraceabilityContent />
    </Suspense>
  );
}
