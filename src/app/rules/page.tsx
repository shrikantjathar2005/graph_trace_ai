"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Plus,
  Network,
  ExternalLink,
  FolderInput,
  Sparkles,
  SlidersHorizontal,
  Info,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AnalysisWorkspaceNav } from "@/components/layout/AnalysisWorkspaceNav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProject } from "@/context/ProjectContext";
import { apiService } from "@/services/api";
import {
  ArchitectureRule,
  ValidationSummary,
  DEFAULT_ARCHITECTURE_RULES,
  FindingStatus,
  RuleSeverity,
  RuleDirection,
} from "@/types/rules";
import { EntityType, RequirementPriority } from "@/types/entities";
import { GraphRelationshipType } from "@/types/graph";

function RulesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityParam = searchParams.get("entity");
  const { currentProject, selectProjectById } = useProject();

  const sessionKey = useMemo(() => {
    return "graphtrace.session_rules." + currentProject.id + ".v1";
  }, [currentProject.id]);

  const [rules, setRules] = useState<ArchitectureRule[]>(DEFAULT_ARCHITECTURE_RULES);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize rules when project changes to prevent cross-project custom rule leakage
  useEffect(() => {
    queueMicrotask(() => {
      try {
        if (typeof window !== "undefined") {
          const saved = sessionStorage.getItem(sessionKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setRules(parsed);
              return;
            }
          }
        }
      } catch {
        // Safely fall back to default rules on storage error
      }
      setRules(DEFAULT_ARCHITECTURE_RULES);
    });
  }, [sessionKey]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"ALL" | FindingStatus>("ALL");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | RuleSeverity>("ALL");

  // Custom rule modal toggle & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customKind, setCustomKind] = useState<ArchitectureRule["kind"]>("FORBIDDEN_DEPENDENCY");
  const [customSeverity, setCustomSeverity] = useState<RuleSeverity>("ERROR");
  const [customSourceType, setCustomSourceType] = useState<EntityType>("component");
  const [customSourcePriority, setCustomSourcePriority] = useState<"ALL" | RequirementPriority>("ALL");
  const [customTargetType, setCustomTargetType] = useState<EntityType>("module");
  const [customTargetPattern, setCustomTargetPattern] = useState("");
  const [regexError, setRegexError] = useState<string | null>(null);

  // Specific relationship selectors
  const [customForbiddenRels, setCustomForbiddenRels] = useState<GraphRelationshipType[]>([
    "CALLS",
    "IMPORTS",
    "DEPENDS_ON",
  ]);
  const [customRequiredRel, setCustomRequiredRel] = useState<GraphRelationshipType>("VERIFIES");
  const [customDirection, setCustomDirection] = useState<RuleDirection>("TARGET_TO_SOURCE");

  const runValidation = useCallback(async (currentRules: ArchitectureRule[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.validateArchitectureRules(currentProject.id, currentRules);
      if (res.success) {
        setSummary(res.data);
      } else {
        setError(res.message || "Failed to execute architecture rules validation.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error executing rule validation");
    } finally {
      setLoading(false);
    }
  }, [currentProject.id]);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (!ignore) {
        runValidation(rules);
      }
    });
    return () => {
      ignore = true;
    };
  }, [runValidation, rules]);

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) => {
      const updated = prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionKey, JSON.stringify(updated));
        }
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const handleToggleForbiddenRel = (rel: GraphRelationshipType) => {
    setCustomForbiddenRels((prev) =>
      prev.includes(rel) ? prev.filter((r) => r !== rel) : [...prev, rel]
    );
  };

  const handleCreateCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    if (customKind === "FORBIDDEN_DEPENDENCY" && customForbiddenRels.length === 0) {
      setRegexError("Please select at least one forbidden relationship type.");
      return;
    }

    // Validate regex if present
    if (customTargetPattern.trim()) {
      try {
        new RegExp(customTargetPattern.trim(), "i");
        setRegexError(null);
      } catch (err) {
        setRegexError("Invalid regex pattern: " + (err instanceof Error ? err.message : "Syntax error"));
        return;
      }
    } else {
      setRegexError(null);
    }

    const newRule: ArchitectureRule = {
      id: "custom-rule-" + Date.now(),
      name: customName.trim(),
      description:
        customDesc.trim() ||
        ("Enforce " + customKind + " from " + customSourceType + " to " + customTargetType + "."),
      kind: customKind,
      severity: customSeverity,
      enabled: true,
      source: {
        entityType: customSourceType,
        priority: customSourceType === "requirement" && customSourcePriority !== "ALL" ? customSourcePriority : undefined,
      },
      target:
        customKind !== "CIRCULAR_DEPENDENCY"
          ? {
              entityType: customTargetType,
              filePathPattern: customTargetPattern.trim() || undefined,
            }
          : undefined,
      forbiddenRelationships:
        customKind === "FORBIDDEN_DEPENDENCY"
          ? customForbiddenRels
          : customKind === "CIRCULAR_DEPENDENCY"
          ? ["CALLS", "IMPORTS", "DEPENDS_ON", "EXTENDS"]
          : undefined,
      requiredRelationship:
        customKind === "REQUIRED_RELATIONSHIP" ? customRequiredRel : undefined,
      direction:
        customKind === "REQUIRED_RELATIONSHIP" ? customDirection : undefined,
      isCustom: true,
    };

    setRules((prev) => {
      const next = [newRule, ...prev];
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionKey, JSON.stringify(next));
        }
      } catch {
        // Ignored
      }
      return next;
    });

    setCustomName("");
    setCustomDesc("");
    setCustomTargetPattern("");
    setRegexError(null);
    setShowAddModal(false);
  };

  const filteredFindings =
    summary?.findings.filter((f) => {
      if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
      if (severityFilter !== "ALL" && f.severity !== severityFilter) return false;
      return true;
    }) || [];

  const isUnindexedSample = currentProject.isSample && currentProject.id !== "fintrack";

  return (
    <PageContainer
      title="Architecture Rule Validation & Drift Detection"
      description={
        currentProject.isSample
          ? ("Deterministic verification of declared layer boundaries and structural constraints for " + currentProject.name + " (Demonstration Model).")
          : ("Structural constraint checking and architecture drift evaluation against " + currentProject.name + "'s knowledge graph.")
      }
      badge={
        <Badge variant={currentProject.isSample ? "outline" : "success"}>
          {currentProject.isSample ? "Sample Model" : "Imported Workspace"}
        </Badge>
      }
      breadcrumbs={[{ label: currentProject.name }, { label: "Architecture Rules" }]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => runValidation(rules)}
            disabled={loading}
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Re-validate
          </Button>
          <Button
            size="xs"
            variant="primary"
            onClick={() => {
              setRegexError(null);
              setShowAddModal(true);
            }}
            icon={<Plus className="w-3 h-3" />}
          >
            New Rule
          </Button>
        </div>
      }
    >
      {error && <ErrorBanner message={error} onRetry={() => runValidation(rules)} className="mb-4" />}

      {/* 5-Perspective Workspace Navigation */}
      <AnalysisWorkspaceNav currentEntityId={entityParam} className="mb-4 rounded-lg" />

      {isUnindexedSample ? (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-amber-400 mb-4 shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Rule Validation Unavailable for {currentProject.name}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 mb-5 leading-relaxed">
            This project has not been indexed yet. Architecture rule validation requires an active Software Knowledge Graph. Select FinTrack Banking Core to explore demonstration validation findings.
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
      ) : (
        <div className="space-y-6">
          {/* Top Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-rose-900/50 bg-rose-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-rose-300">
                  <span className="text-xs font-mono uppercase">Violations Found</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-rose-400">
                    {loading ? "..." : (summary?.violationsCount ?? 0)}
                  </span>
                  <span className="text-xs text-rose-300/80 font-mono">
                    ({summary?.bySeverity.ERROR ?? 0} errors)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-900/50 bg-emerald-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-emerald-300">
                  <span className="text-xs font-mono uppercase">Passing Checks</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {loading ? "..." : (summary?.passedCount ?? 0)}
                  </span>
                  <span className="text-xs text-emerald-300/80 font-mono">rules satisfied</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-mono uppercase">Insufficient Evidence</span>
                  <HelpCircle className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-zinc-300">
                    {loading ? "..." : (summary?.insufficientEvidenceCount ?? 0)}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">missing selector nodes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-mono uppercase">Active Rules</span>
                  <ShieldCheck className="w-4 h-4 text-[#25C4B4]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-zinc-100">
                    {rules.filter((r) => r.enabled).length}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    of {rules.length} declared ({currentProject.name})
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main 2-Column Split: Rule Configuration & Findings Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Rules Registry (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-[#2A3547]">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#25C4B4]" />
                      Declared Architecture Rules
                    </CardTitle>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {rules.filter((r) => r.enabled).length} active
                    </span>
                  </div>
                  <CardDescription className="text-xs text-zinc-400 mt-1">
                    Toggle rules to enforce boundaries. Rules are isolated per project ({currentProject.name}).
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 divide-y divide-[#2A3547]/60">
                  {rules.map((rule) => (
                    <div key={rule.id} className="py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={"text-xs font-semibold leading-tight " + (rule.enabled ? "text-zinc-100" : "text-zinc-500 line-through")}>
                            {rule.name}
                          </span>
                          <Badge
                            variant={rule.severity === "ERROR" ? "danger" : rule.severity === "WARNING" ? "warning" : "default"}
                            size="sm"
                          >
                            {rule.severity}
                          </Badge>
                          {rule.isCustom && (
                            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans line-clamp-2">
                          {rule.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 pt-0.5">
                          <span className="text-[#25C4B4]">
                            {rule.source.entityType || "any"}
                            {rule.source.priority ? " [" + rule.source.priority + "]" : ""}
                          </span>
                          <span>&rarr;</span>
                          <span className="text-zinc-300">{rule.kind.replace("_", " ")}</span>
                          {rule.target && (
                            <>
                              <span>&rarr;</span>
                              <span className="text-amber-400">{rule.target.entityType || "any"}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id)}
                        className={"shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus:outline-none " + (rule.enabled ? "bg-[#25C4B4]" : "bg-zinc-700")}
                        title={rule.enabled ? "Disable this rule" : "Enable this rule"}
                        aria-label={(rule.enabled ? "Disable" : "Enable") + " rule " + rule.name}
                      >
                        <span
                          className={"inline-block h-3.5 w-3.5 transform rounded-full bg-zinc-950 transition-transform " + (rule.enabled ? "translate-x-4" : "translate-x-1")}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Notice on heuristic evaluation & storage limitation */}
              <div className="p-3.5 rounded-lg border border-[#2A3547] bg-[#141B27]/70 text-xs font-mono text-zinc-400 space-y-1.5">
                <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px]">
                  <Info className="w-3.5 h-3.5 text-[#25C4B4]" /> Validation Grounding & Storage Policy
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  Rule validation evaluates solely against verified and heuristic edges in {currentProject.name}&apos;s Software Knowledge Graph. Custom rules are kept session-scoped and project-isolated ({sessionKey}) to prevent accidental bleed between projects.
                </p>
              </div>
            </div>

            {/* RIGHT: Findings & Drift List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-[#2A3547]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      Rule Validation Findings ({filteredFindings.length})
                    </CardTitle>

                    {/* Filter controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "ALL" | FindingStatus)}
                        className="bg-[#10151F] border border-[#2A3547] rounded px-2.5 py-1 text-[11px] text-zinc-200 font-mono focus:outline-none focus:border-[#25C4B4]"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="VIOLATION">Violations Only</option>
                        <option value="PASSED">Passed Only</option>
                        <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</option>
                      </select>

                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value as "ALL" | RuleSeverity)}
                        className="bg-[#10151F] border border-[#2A3547] rounded px-2.5 py-1 text-[11px] text-zinc-200 font-mono focus:outline-none focus:border-[#25C4B4]"
                      >
                        <option value="ALL">All Severities</option>
                        <option value="ERROR">Errors</option>
                        <option value="WARNING">Warnings</option>
                        <option value="INFO">Info</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3.5">
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : filteredFindings.length === 0 ? (
                    <div className="p-12 text-center text-xs font-mono text-zinc-500">
                      No validation findings matching the selected filters.
                    </div>
                  ) : (
                    filteredFindings.map((finding) => (
                      <div
                        key={finding.id}
                        className={"p-3.5 rounded-lg border transition-all space-y-2.5 " + (
                          finding.status === "VIOLATION"
                            ? "border-rose-900/60 bg-rose-950/20"
                            : finding.status === "PASSED"
                            ? "border-emerald-900/50 bg-emerald-950/15"
                            : "border-zinc-800 bg-zinc-900/40"
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant={
                                  finding.status === "VIOLATION"
                                    ? "danger"
                                    : finding.status === "PASSED"
                                    ? "success"
                                    : "default"
                                }
                                size="sm"
                              >
                                {finding.status}
                              </Badge>
                              <Badge
                                variant={
                                  finding.severity === "ERROR"
                                    ? "danger"
                                    : finding.severity === "WARNING"
                                    ? "warning"
                                    : "default"
                                }
                                size="sm"
                              >
                                {finding.severity}
                              </Badge>
                              {finding.isHeuristicEvidence && (
                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                                  Heuristic Evidence (&lt;100%)
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-semibold text-zinc-100 mt-1">
                              {finding.ruleName}
                            </h4>
                          </div>
                        </div>

                        {/* Finding Message */}
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          {finding.message}
                        </p>

                        {/* Evidence breakdown */}
                        {finding.evidence.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                              Evidence Chains ({finding.evidence.length}):
                            </span>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {finding.evidence.map((ev, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded bg-[#10151F] border border-[#2A3547] flex items-center justify-between text-xs font-mono"
                                >
                                  <div className="flex items-center gap-1.5 truncate pr-2">
                                    <Badge variant={ev.sourceEntityType} size="sm">
                                      {ev.sourceEntityType}
                                    </Badge>
                                    <span className="text-zinc-200 truncate">{ev.sourceEntityName}</span>
                                    {ev.relationship && (
                                      <>
                                        <span className="text-rose-400 font-bold">&ndash;[{ev.relationship}]&rarr;</span>
                                        {ev.targetEntityType && (
                                          <Badge variant={ev.targetEntityType} size="sm">
                                            {ev.targetEntityType}
                                          </Badge>
                                        )}
                                        <span className="text-zinc-300 truncate">{ev.targetEntityName || ev.targetEntityId}</span>
                                      </>
                                    )}
                                  </div>

                                  {/* Deep link into Graph Explorer */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Link
                                      href={"/graph?entity=" + encodeURIComponent(ev.sourceEntityId)}
                                      className="p-1 rounded text-zinc-400 hover:text-[#25C4B4] hover:bg-[#192333] transition-colors"
                                      title="Open entity in Knowledge Graph Explorer"
                                    >
                                      <Network className="w-3.5 h-3.5" />
                                    </Link>
                                    {ev.targetEntityId && (
                                      <Link
                                        href={"/graph?entity=" + encodeURIComponent(ev.targetEntityId)}
                                        className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-[#192333] transition-colors"
                                        title="Open target in Knowledge Graph Explorer"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Remediation Advice */}
                        {finding.remediationAdvice && (
                          <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 font-sans">
                            <span className="font-semibold text-zinc-300">Remediation: </span>
                            {finding.remediationAdvice}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating Custom Architecture Rule */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg bg-[#141B27] border border-[#2A3547] rounded-xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#2A3547]">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#25C4B4]" /> Declare Custom Architecture Rule
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-100 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCustomRule} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Controllers must not import SQL repositories"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#10151F] border border-[#2A3547] rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-[#25C4B4]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain architectural rationale..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full bg-[#10151F] border border-[#2A3547] rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-[#25C4B4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Rule Kind</label>
                  <select
                    value={customKind}
                    onChange={(e) => setCustomKind(e.target.value as ArchitectureRule["kind"])}
                    className="w-full bg-[#10151F] border border-[#2A3547] rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-[#25C4B4]"
                  >
                    <option value="FORBIDDEN_DEPENDENCY">Forbidden Dependency</option>
                    <option value="REQUIRED_RELATIONSHIP">Required Relationship</option>
                    <option value="CIRCULAR_DEPENDENCY">Circular Dependency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Severity</label>
                  <select
                    value={customSeverity}
                    onChange={(e) => setCustomSeverity(e.target.value as RuleSeverity)}
                    className="w-full bg-[#10151F] border border-[#2A3547] rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-[#25C4B4]"
                  >
                    <option value="ERROR">Error (Blocker)</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Source Layer</label>
                  <select
                    value={customSourceType}
                    onChange={(e) => setCustomSourceType(e.target.value as EntityType)}
                    className="w-full bg-[#10151F] border border-[#2A3547] rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-[#25C4B4]"
                  >
                    <option value="component">Component</option>
                    <option value="module">Module</option>
                    <option value="class">Class</option>
                    <option value="method">Method</option>
                    <option value="architecture">Architecture</option>
                    <option value="requirement">Requirement</option>
                    <option value="test">Test</option>
                  </select>
                </div>

                {customSourceType === "requirement" ? (
                  <div>
                    <label className="block text-zinc-400 mb-1">Priority Filter</label>
                    <select
                      value={customSourcePriority}
                      onChange={(e) => setCustomSourcePriority(e.target.value as "ALL" | RequirementPriority)}
                      className="w-full bg-[#10151F] border border-[#2A3547] rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-[#25C4B4]"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="CRITICAL">CRITICAL Only</option>
                      <option value="HIGH">HIGH Only</option>
                      <option value="MEDIUM">MEDIUM Only</option>
                      <option value="LOW">LOW Only</option>
                    </select>
                  </div>
                ) : customKind !== "CIRCULAR_DEPENDENCY" ? (
                  <div>
                    <label className="block text-zinc-400 mb-1">Target Layer</label>
                    <select
                      value={customTargetType}
                      onChange={(e) => setCustomTargetType(e.target.value as EntityType)}
                      className="w-full bg-[#10151F] border border-[#2A3547] rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-[#25C4B4]"
                    >
                      <option value="module">Module</option>
                      <option value="component">Component</option>
                      <option value="class">Class</option>
                      <option value="method">Method</option>
                      <option value="architecture">Architecture</option>
                      <option value="requirement">Requirement</option>
                      <option value="test">Test</option>
                    </select>
                  </div>
                ) : null}
              </div>

              {/* Kind-specific configuration */}
              {customKind === "FORBIDDEN_DEPENDENCY" && (
                <div>
                  <label className="block text-zinc-400 mb-1">Forbidden Relationship Types</label>
                  <div className="flex items-center gap-3 py-1">
                    {(["CALLS", "IMPORTS", "DEPENDS_ON", "EXTENDS"] as GraphRelationshipType[]).map((rel) => {
                      const isChecked = customForbiddenRels.includes(rel);
                      return (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => handleToggleForbiddenRel(rel)}
                          className={"flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-colors " + (
                            isChecked
                              ? "bg-[#192333] border-[#25C4B4] text-[#25C4B4]"
                              : "bg-[#10151F] border-[#2A3547] text-zinc-500"
                          )}
                        >
                          {isChecked && <Check className="w-3 h-3 text-[#25C4B4]" />}
                          <span>{rel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {customKind === "REQUIRED_RELATIONSHIP" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Required Relationship</label>
                    <select
                      value={customRequiredRel}
                      onChange={(e) => setCustomRequiredRel(e.target.value as GraphRelationshipType)}
                      className="w-full bg-[#10151F] border border-[#2A3547] rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-[#25C4B4]"
                    >
                      <option value="VERIFIES">VERIFIES</option>
                      <option value="REALIZES">REALIZES</option>
                      <option value="DOCUMENTS">DOCUMENTS</option>
                      <option value="CONTAINS">CONTAINS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Direction</label>
                    <select
                      value={customDirection}
                      onChange={(e) => setCustomDirection(e.target.value as RuleDirection)}
                      className="w-full bg-[#10151F] border border-[#2A3547] rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-[#25C4B4]"
                    >
                      <option value="TARGET_TO_SOURCE">Target &rarr; Source (e.g. Test verifies Req)</option>
                      <option value="SOURCE_TO_TARGET">Source &rarr; Target (e.g. Req realizes Mod)</option>
                    </select>
                  </div>
                </div>
              )}

              {customKind === "CIRCULAR_DEPENDENCY" && (
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                  Detects closed dependency loops (CALLS, IMPORTS, DEPENDS_ON) among entities within the selected source layer.
                </div>
              )}

              {customKind !== "CIRCULAR_DEPENDENCY" && (
                <div>
                  <label className="block text-zinc-400 mb-1">Target Path / Name Filter (optional regex)</label>
                  <input
                    type="text"
                    placeholder="e.g. database|repository|store"
                    value={customTargetPattern}
                    onChange={(e) => {
                      setCustomTargetPattern(e.target.value);
                      if (regexError) setRegexError(null);
                    }}
                    className={"w-full bg-[#10151F] border rounded px-3 py-1.5 text-zinc-200 focus:outline-none " + (
                      regexError ? "border-rose-500" : "border-[#2A3547] focus:border-[#25C4B4]"
                    )}
                  />
                  {regexError && (
                    <p className="text-[10.5px] text-rose-400 mt-1">{regexError}</p>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2A3547]">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary">
                  Save Rule ({currentProject.name})
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default function RulesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-zinc-500">Loading architecture rules workspace...</div>}>
      <RulesContent />
    </Suspense>
  );
}
