"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Network, RefreshCw } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { KnowledgeGraphCanvas } from "@/components/graph/KnowledgeGraphCanvas";
import { apiService } from "@/services/api";
import { KnowledgeGraphData } from "@/types/graph";

export default function GraphPage() {
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getKnowledgeGraph();
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
  };

  useEffect(() => {
    loadGraph();
  }, []);

  return (
    <PageContainer
      title="Knowledge Graph Explorer"
      description="Interactive 8-tier visualization of software artifacts, AST relationships, and end-to-end trace links."
      breadcrumbs={[{ label: "FinTrack Banking Core" }, { label: "Knowledge Graph" }]}
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
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-zinc-400">
            Computing hierarchical DAG graph layout...
          </p>
        </div>
      ) : graphData ? (
        <Suspense fallback={<div className="h-full w-full bg-[#09090b]" />}>
          <KnowledgeGraphCanvas initialData={graphData} />
        </Suspense>
      ) : null}
    </PageContainer>
  );
}
