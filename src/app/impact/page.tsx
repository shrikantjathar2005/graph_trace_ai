"use client";

import React, { useEffect, useState } from "react";
import { Flame, AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert, Cpu } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/api";
import { ImpactAnalysisResult } from "@/types/impact";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ImpactPage() {
  const [targetId, setTargetId] = useState<string>("MTH-EXECUTE-PAYMENT");
  const [changeType, setChangeType] = useState<string>("MODIFY_SIGNATURE");
  const [result, setResult] = useState<ImpactAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getImpactAnalysis(targetId, changeType);
      if (res.success) {
        setResult(res.data);
      } else {
        setError("Failed to run change impact analysis.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error executing analysis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [targetId, changeType]);

  return (
    <PageContainer
      title="Change Impact Simulator (Blast Radius)"
      description="Predict upstream and downstream breaking changes across requirements, code, tests, and documentation before committing code."
      breadcrumbs={[{ label: "FinTrack Banking Core" }, { label: "Change Impact" }]}
      actions={
        <div className="flex items-center gap-2">
          <Button size="xs" variant="primary" onClick={runAnalysis} icon={<Flame className="w-3 h-3" />}>
            Re-simulate Blast Radius
          </Button>
        </div>
      }
    >
      {error && <ErrorBanner message={error} onRetry={runAnalysis} className="mb-6" />}

      {/* Target Selection Bar */}
      <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/60 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-mono uppercase text-zinc-400">Target Entity:</span>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
          >
            <option value="MTH-EXECUTE-PAYMENT">Method: processTransaction() [PaymentProcessor]</option>
            <option value="MTH-VERIFY-JWT">Method: verifySessionToken() [SessionValidator]</option>
            <option value="MOD-AUTH-SERVICE">Module: auth_session.ts</option>
          </select>

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

        <Badge variant="danger" size="sm" className="self-start md:self-auto">
          M3 REASONING ENGINE POWERED
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
                  <span className="text-xs font-mono uppercase">Overall Risk Level</span>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-rose-400">
                    {result.overallRisk}
                  </span>
                  <span className="text-xs text-rose-300/80 font-mono">
                    Score: {result.riskScore}/100
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
                  <span className="text-xs text-amber-300/80 font-mono">require update</span>
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
                  <span className="text-xs text-zinc-500 font-mono">ADR & OpenAPI</span>
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
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-mono uppercase text-zinc-400">
                    <th className="py-3 px-4 font-semibold">Entity</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Distance</th>
                    <th className="py-3 px-4 font-semibold">Risk Level</th>
                    <th className="py-3 px-4 font-semibold">Impact Propagation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {result.affectedItems.map((item) => (
                    <tr key={item.entityId} className="hover:bg-zinc-900/30">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-200">{item.entityName}</span>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageContainer>
  );
}
