"use client";

import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { CoverageScorecard } from "@/components/traceability/CoverageScorecard";
import { RequirementList } from "@/components/traceability/RequirementList";
import { TraceabilityChain } from "@/components/traceability/TraceabilityChain";
import { TraceabilityInspector } from "@/components/traceability/TraceabilityInspector";
import { TraceabilityMatrixTable } from "@/components/traceability/TraceabilityMatrixTable";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiService } from "@/services/api";
import { TraceabilityMatrixRow, TraceabilitySummaryStats } from "@/types/traceability";
import { AnyTraceEntity } from "@/types/entities";

export default function TraceabilityPage() {
  const [data, setData] = useState<{
    rows: TraceabilityMatrixRow[];
    summary: TraceabilitySummaryStats;
  } | null>(null);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<AnyTraceEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getTraceabilityMatrix();
      if (res.success) {
        setData(res.data);
        if (res.data.rows.length > 0 && !selectedReqId) {
          setSelectedReqId(res.data.rows[0].requirement.id);
          setSelectedEntity(res.data.rows[0].requirement);
        }
      } else {
        setError("Failed to fetch requirement traceability data.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading traceability data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <PageContainer
      title="Requirement Traceability Workspace"
      description="Bi-directional traceability mapping SRS specifications to architecture, code components, AST methods, test suites, and documentation."
      breadcrumbs={[{ label: "FinTrack Banking Core" }, { label: "Traceability Workspace" }]}
      fullWidth
    >
      <div className="p-6 space-y-5 max-w-full">
        {error && <ErrorBanner message={error} onRetry={loadData} className="mb-4" />}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[640px]">
              <Skeleton className="lg:col-span-3 h-full" />
              <Skeleton className="lg:col-span-6 h-full" />
              <Skeleton className="lg:col-span-3 h-full" />
            </div>
          </div>
        ) : data ? (
          <>
            {/* Top: Scorecard */}
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
