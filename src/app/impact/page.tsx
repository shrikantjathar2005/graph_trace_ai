"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Flame,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  RefreshCw,
  FolderInput,
  Sparkles,
  Network,
  FileCheck2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AnalysisWorkspaceNav } from "@/components/layout/AnalysisWorkspaceNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/api";
import { ImpactAnalysisResult } from "@/types/impact";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useProject } from "@/context/ProjectContext";
import { Skeleton } from "@/components/ui/Skeleton";

interface SelectOption {
  id: string;
  label: string;
}

const fintrackOptions: SelectOption[] = [
  { id: "MTH-EXECUTE-PAYMENT", label: "Method: processTransaction() [PaymentProcessor]" },
  { id: "MTH-VERIFY-JWT", label: "Method: verifySessionToken() [SessionValidator]" },
  { id: "MOD-AUTH-SERVICE", label: "Module: auth_session.ts" },
];

function ImpactContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityParam = searchParams.get("entity") || searchParams.get("target");
  const { currentProject, selectProjectById } = useProject();

  const [availableTargets, setAvailableTargets] = useState<SelectOption[]>(fintrackOptions);
  const [targetId, setTargetId] = useState<string>("MTH-EXECUTE-PAYMENT");
  const [changeType, setChangeType] = useState<string>("MODIFY_SIGNATURE");
  const [result, setResult] = useState<ImpactAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize available target options with the selected project
  useEffect(() => {
    let active = true;

    async function syncTargetEntities() {
      if (currentProject.id === "fintrack") {
        let opts = [...fintrackOptions];
        if (entityParam) {
          const res = await apiService.getKnowledgeGraph({ projectId: "fintrack" });
          if (!active) return;
          if (res.success) {
            const foundNode = res.data.nodes.find((n) => n.id.toLowerCase() === entityParam.toLowerCase());
            if (foundNode && !opts.some((o) => o.id === foundNode.id)) {
              opts = [{ id: foundNode.id, label: `${foundNode.type.toUpperCase()}: ${foundNode.label}` }, ...opts];
            }
          }
        }
        if (!active) return;
        setAvailableTargets(opts);
        const resolved = entityParam && opts.some((o) => o.id.toLowerCase() === entityParam.toLowerCase())
          ? opts.find((o) => o.id.toLowerCase() === entityParam.toLowerCase())!.id
          : "MTH-EXECUTE-PAYMENT";
        setTargetId(resolved);
        return;
      }

      if (currentProject.id.startsWith("imported")) {
        const res = await apiService.getKnowledgeGraph({ projectId: currentProject.id });
        if (!active) return;
        if (res.success && res.data.nodes.length > 0) {
          const candidates = res.data.nodes
            .filter((n) => n.type === "method" || n.type === "module" || n.type === "requirement" || (entityParam && n.id.toLowerCase() === entityParam.toLowerCase()))
            .map((n) => ({
              id: n.id,
              label: `${n.type.toUpperCase()}: ${n.label}`,
            }));

          if (candidates.length > 0) {
            setAvailableTargets(candidates);
            const matched = entityParam ? candidates.find((c) => c.id.toLowerCase() === entityParam.toLowerCase()) : null;
            setTargetId(matched ? matched.id : candidates[0].id);
          } else {
            setAvailableTargets([]);
            setTargetId("");
          }
        } else {
          setAvailableTargets([]);
          setTargetId("");
        }
        return;
      }

      // Unindexed sample project
      setAvailableTargets([]);
      setTargetId("");
    }

    syncTargetEntities();
    return () => {
      active = false;
    };
  }, [currentProject.id, entityParam]);

  const runAnalysis = useCallback(async () => {
    if (!targetId) {
      setLoading(false);
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getImpactAnalysis(targetId, changeType, currentProject.id);
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.message || "Failed to execute change impact analysis.");
        setResult(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error executing analysis");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [targetId, changeType, currentProject.id]);

  useEffect(() => {
    let ignore = false;
    if (!targetId) {
      queueMicrotask(() => {
        if (!ignore) {
          setLoading(false);
          setResult(null);
        }
      });
      return () => { ignore = true; };
    }
    queueMicrotask(() => {
      if (!ignore) runAnalysis();
    });
    return () => { ignore = true; };
  }, [runAnalysis, targetId]);

  // Synchronize targetId when entityParam changes dynamically post-mount
  const prevParamRef = useRef(entityParam);
  useEffect(() => {
    if (entityParam && entityParam !== prevParamRef.current) {
      prevParamRef.current = entityParam;
      const matched = availableTargets.find(
        (t) => t.id.toLowerCase() === entityParam.toLowerCase()
      );
      if (matched) {
        queueMicrotask(() => setTargetId(matched.id));
      }
    }
  }, [entityParam, availableTargets]);

  const isUnindexedSample = currentProject.isSample && currentProject.id !== "fintrack";
  const hasNoTargets = !isUnindexedSample && availableTargets.length === 0;

  return (
    <PageContainer
      title="Change Impact Simulator (Heuristic Blast Radius)"
      description={
        currentProject.id === "fintrack"
          ? `Simulate upstream and downstream ripple effects across requirements, code, and tests for ${currentProject.name} (Demonstration Model).`
          : `Simulate upstream and downstream ripple effects for ${currentProject.name} using graph traversal.`
      }
      badge={
        <Badge
          variant={
            currentProject.id === "fintrack"
              ? "outline"
              : currentProject.id.startsWith("imported")
              ? "success"
              : "default"
          }
        >
          {currentProject.id === "fintrack"
            ? "M3 REASONING DEMO"
            : currentProject.id.startsWith("imported")
            ? "CLIENT-SIDE GRAPH TRAVERSAL"
            : "UNAVAILABLE"}
        </Badge>
      }
      breadcrumbs={[{ label: currentProject.name }, { label: "Change Impact" }]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={runAnalysis}
            disabled={!targetId || loading}
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Re-simulate
          </Button>
        </div>
      }
    >
      {error && <ErrorBanner message={error} onRetry={runAnalysis} className="mb-4" />}

      {/* 4-Perspective Workspace Navigation */}
      <AnalysisWorkspaceNav currentEntityId={targetId} className="mb-4 rounded-lg" />

      {isUnindexedSample ? (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-amber-400 mb-4 shadow-sm">
            <Flame className="w-7 h-7" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Impact Analysis Unavailable for {currentProject.name}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 mb-5 leading-relaxed">
            This project has not been indexed. Blast-radius ripple analysis requires knowledge graph dependency extraction. Select FinTrack Banking Core to explore demonstration blast-radius models.
          </p>
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              onClick={() => selectProjectById("fintrack")}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Switch to FinTrack Sample
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/ingest")}
              icon={<FolderInput className="w-3.5 h-3.5" />}
            >
              Import Repository
            </Button>
          </div>
        </div>
      ) : hasNoTargets ? (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-4 shadow-sm">
            <Flame className="w-7 h-7" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            No Target Entities in {currentProject.name}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 mb-5 leading-relaxed">
            No functions, modules, or requirements were found in this project to simulate. Ingest source code containing functions or classes to calculate change impact.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/ingest")}
            icon={<FolderInput className="w-3.5 h-3.5" />}
          >
            Import Code Artifacts
          </Button>
        </div>
      ) : (
        <>
          {/* Simulation Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-mono uppercase text-zinc-400">Target Entity:</span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700 max-w-sm"
              >
                {availableTargets.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {targetId && (
                <div className="flex items-center gap-1.5 ml-1">
                  <Link href={`/graph?entity=${encodeURIComponent(targetId)}`}>
                    <Button size="xs" variant="outline" icon={<Network className="w-3 h-3 text-[#25C4B4]" />} title="Open target in Knowledge Graph Explorer">
                      Graph
                    </Button>
                  </Link>
                  <Link href={`/traceability?entity=${encodeURIComponent(targetId)}`}>
                    <Button size="xs" variant="outline" icon={<FileCheck2 className="w-3 h-3 text-cyan-400" />} title="Trace target in Traceability Matrix">
                      Trace
                    </Button>
                  </Link>
                </div>
              )}

              <span className="text-xs font-mono uppercase text-zinc-400 sm:ml-2">Change Type:</span>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
              >
                <option value="MODIFY_SIGNATURE">Modify Function Signature</option>
                <option value="CHANGE_LOGIC">Internal Algorithm Change</option>
                <option value="DEPRECATE">Deprecate Endpoint</option>
                <option value="DELETE">Delete Unit</option>
              </select>
            </div>

            <Badge
              variant={currentProject.id === "fintrack" ? "danger" : "default"}
              size="sm"
              className="self-start md:self-auto"
            >
              {currentProject.id === "fintrack"
                ? "M3 REASONING ENGINE DEMO"
                : "CLIENT-SIDE GRAPH TRAVERSAL"}
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Risk Score Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-rose-900/50 bg-rose-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-rose-300">
                      <span className="text-xs font-mono uppercase">Heuristic Risk Level</span>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-rose-400">
                        {result.overallRisk}
                      </span>
                      <span className="text-xs text-rose-300/80 font-mono">
                        Heuristic Score: {result.riskScore}/100
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-xs font-mono uppercase">Direct Affected (1-hop)</span>
                      <Cpu className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-zinc-100">
                        {result.directAffectedCount}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        +{result.indirectAffectedCount} indirect
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-900/50 bg-amber-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="text-xs font-mono uppercase">Tests At Risk</span>
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-amber-400">
                        {result.affectededTestCount} suites
                      </span>
                      <span className="text-xs text-amber-300/80 font-mono">require review</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-xs font-mono uppercase">Out-of-Sync Docs</span>
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-teal-400">
                        {result.affectedDocsCount} specs
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">documents mapped</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Blast Radius Breakdown Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Downstream & Upstream Affected Entities</CardTitle>
                  <CardDescription>
                    Calculated graph traversal blast radius from selected target node
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {result.affectedItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500">
                      No connected entities found within 2 hops of this target node.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-mono uppercase text-zinc-400">
                          <th className="py-3 px-4 font-semibold">Entity</th>
                          <th className="py-3 px-4 font-semibold">Type</th>
                          <th className="py-3 px-4 font-semibold">Distance</th>
                          <th className="py-3 px-4 font-semibold">Risk Level</th>
                          <th className="py-3 px-4 font-semibold">Impact Propagation Reason</th>
                          <th className="py-3 px-4 font-semibold text-right">Cross-Perspective</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {result.affectedItems.map((item) => (
                          <tr key={item.entityId} className="hover:bg-zinc-900/30">
                            <td className="py-3 px-4">
                              <Link href={`/graph?entity=${encodeURIComponent(item.entityId)}`} className="font-semibold text-zinc-200 hover:text-[#25C4B4] transition-colors">{item.entityName}</Link>
                              {item.filePath && (
                                <p className="text-[10px] text-zinc-500 font-mono">{item.filePath}</p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={item.entityType} size="sm">
                                {item.entityType}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-400">
                              {item.hopDistance} hop{item.hopDistance > 1 ? "s" : ""}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  item.riskLevel === "CRITICAL"
                                    ? "danger"
                                    : item.riskLevel === "HIGH"
                                    ? "warning"
                                    : "default"
                                }
                                size="sm"
                              >
                                {item.riskLevel}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-zinc-300 font-sans">{item.impactReason}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/graph?entity=${encodeURIComponent(item.entityId)}`}
                                  className="p-1 rounded text-zinc-400 hover:text-[#25C4B4] hover:bg-zinc-800 transition-colors"
                                  title="Locate in Knowledge Graph Explorer"
                                >
                                  <Network className="w-3.5 h-3.5" />
                                </Link>
                                <Link
                                  href={`/traceability?entity=${encodeURIComponent(item.entityId)}`}
                                  className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                                  title="Trace in Traceability Matrix"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setTargetId(item.entityId)}
                                  className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                                  title="Simulate impact with this entity as target"
                                >
                                  <Flame className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </>
      )}
    </PageContainer>
  );
}


export default function ImpactPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-zinc-500">Loading analysis perspectives...</div>}>
      <ImpactContent />
    </Suspense>
  );
}
