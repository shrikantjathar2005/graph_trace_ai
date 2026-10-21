"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { Network, RefreshCw, FolderInput, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { KnowledgeGraphCanvas } from "@/components/graph/KnowledgeGraphCanvas";
import { AnalysisWorkspaceNav } from "@/components/layout/AnalysisWorkspaceNav";
import { apiService } from "@/services/api";
import { KnowledgeGraphData } from "@/types/graph";
import { useProject } from "@/context/ProjectContext";

export default function GraphPage() {
  const router = useRouter();
  const { currentProject, selectProjectById } = useProject();

  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getKnowledgeGraph({
        projectId: currentProject.id,
      });
      if (res.success) {
        setGraphData(res.data);
      } else {
        setError("Failed to load knowledge graph from engine.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching graph data");
    } finally {
      setLoading(false);
    }
  }, [currentProject.id]);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (!ignore) loadGraph();
    });
    return () => { ignore = true; };
  }, [loadGraph]);

  const isEmpty = !loading && graphData && graphData.nodes.length === 0;

  return (
    <PageContainer
      title="Knowledge Graph Explorer"
      description={
        currentProject.isSample
          ? `Interactive 8-tier visualization of ${currentProject.name} (Demonstration Model).`
          : `Interactive visualization of ${currentProject.name} extracted from imported repository artifacts.`
      }
      badge={
        <Badge variant={currentProject.isSample ? "outline" : "success"}>
          {currentProject.isSample ? "Sample Model" : "Imported Workspace"}
        </Badge>
      }
      breadcrumbs={[{ label: currentProject.name }, { label: "Knowledge Graph" }]}
      fullWidth
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={loadGraph}
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Reload Graph
          </Button>
        </div>
      }
    >
      {error && <ErrorBanner message={error} onRetry={loadGraph} className="m-6" />}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-[var(--text-muted)]">
            Computing hierarchical DAG graph layout for {currentProject.name}...
          </p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-4 shadow-sm">
            <Network className="w-7 h-7" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            No Graph Indexed for {currentProject.name}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 mb-5 leading-relaxed">
            {currentProject.isSample
              ? "This demonstration project has not been ingested yet. You can explore FinTrack Banking Core (built-in sample) or import a repository in Artifact Intake."
              : "No artifacts have been ingested for this project yet. Import files or a project folder to build an interactive knowledge graph."}
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
      ) : graphData ? (
        <Suspense fallback={<div className="h-full w-full bg-[var(--bg)]" />}>
          <div className="flex flex-col h-full w-full">
            <AnalysisWorkspaceNav />
            <KnowledgeGraphCanvas initialData={graphData} projectId={currentProject.id} />
          </div>
        </Suspense>
      ) : null}
    </PageContainer>
  );
}
