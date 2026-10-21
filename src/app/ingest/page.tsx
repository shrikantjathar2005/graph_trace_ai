"use client";

import React, { useRef, useState } from "react";
import {
  FileCode2,
  FolderInput,
  LoaderCircle,
  Network,
  ShieldCheck,
  Upload,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  FileX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ingestArtifacts, IngestionResult } from "@/lib/artifactIngestor";
import { useProject } from "@/context/ProjectContext";
import { ProjectInfo } from "@/types/api";

const supportedExtensions = [
  { ext: ".ts, .tsx", label: "TypeScript", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { ext: ".js, .jsx", label: "JavaScript", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { ext: ".py", label: "Python", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { ext: ".java", label: "Java", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
  { ext: ".go", label: "Go", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  { ext: ".rs", label: "Rust", color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
  { ext: ".md, .mdx", label: "Markdown / SRS", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { ext: ".txt", label: "Specifications", color: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10" },
];

export default function ArtifactIngestionPage() {
  const router = useRouter();
  const { saveNewProject } = useProject();

  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const [projectName, setProjectName] = useState("");
  const [branchName, setBranchName] = useState("main");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [progressStep, setProgressStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);

  const handleIngest = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setErrorMessage("No files were selected. Please choose a folder or select files.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setResult(null);
    setProgressStep(1);

    try {
      setStage("Validating file types and memory quotas...");
      await new Promise((r) => setTimeout(r, 180));

      setProgressStep(2);
      setStage("Extracting software requirements, acceptance criteria, and architecture tiers...");
      const data = await ingestArtifacts(files);

      if (data.graph.nodes.length === 0) {
        setErrorMessage(
          "No extractable code or documentation artifacts found in the selected files. Ensure your selection includes .ts, .js, .py, .java, .go, .rs, or .md files."
        );
        setBusy(false);
        return;
      }

      setProgressStep(3);
      setStage("Connecting AST relationships, function calls, and verification edges...");
      await new Promise((r) => setTimeout(r, 220));

      setProgressStep(4);
      setStage("Persisting knowledge graph to browser workspace storage...");

      const detectedName =
        projectName.trim() ||
        (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split("/")[0] ||
        "Imported Workspace";

      const proj: ProjectInfo = {
        id: "imported-" + Date.now(),
        name: detectedName,
        branch: branchName.trim() || "local",
        stack: data.detectedLanguages.join(" / ") || "Multi-Language",
        isSample: false,
        sourceType: "upload",
        status: data.skippedCount > 0 ? "completed_with_warnings" : "completed",
        importedAt: "Today at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        description: `Imported repository with ${data.moduleCount} modules, ${data.requirementCount} requirements, and ${data.testCount} tests.`,
        counts: {
          files: data.fileCount,
          requirements: data.requirementCount,
          modules: data.moduleCount,
          methods: data.methodCount,
          tests: data.testCount,
          relationships: data.graph.edges.length,
        },
        warnings: data.warnings,
      };

      const saveRes = saveNewProject(proj, data.graph);
      if (!saveRes.success) {
        setErrorMessage(
          saveRes.error ||
            "Failed to persist knowledge graph to browser storage. Your browser storage quota may have been exceeded."
        );
        setResult(null);
        return;
      }
      setResult(data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while reading project files. Try a smaller file selection."
      );
    } finally {
      setBusy(false);
      setStage("");
      setProgressStep(0);
      if (fileRef.current) fileRef.current.value = "";
      if (folderRef.current) folderRef.current.value = "";
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleIngest(e.dataTransfer.files);
    }
  };

  return (
    <PageContainer
      title="Import Project Artifacts"
      description="Create a client-side Software Knowledge Graph by ingesting local requirements, source code, and tests."
      badge={<Badge variant="outline">Client-Side Intake</Badge>}
      breadcrumbs={[{ label: "Projects" }, { label: "Artifact Intake" }]}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Honest System Capability Banner */}
        <div className="rounded-xl border border-[#2A3547] bg-[#141B27]/90 p-4 text-xs text-zinc-300 flex gap-3 items-start shadow-md">
          <Info className="w-4 h-4 text-[#25C4B4] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-zinc-100 font-semibold block">
              Client-Side Heuristic Ingestion (Browser Sandbox)
            </strong>
            <p className="leading-relaxed text-zinc-400">
              Files are parsed entirely inside your browser memory using client-side heuristic pattern extraction (requirements, functions, modules, and test suites). This uses regex-based extraction rather than a full compiler AST.{" "}
              <b className="text-zinc-200">Zero code is sent to an external server.</b> Discovered test entities represent static code artifacts; tests are not executed.
            </p>
          </div>
        </div>

        {/* Project Setup Card */}
        <Card className="bg-[#141B27] border-[#2A3547]">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-100">
              <FolderInput className="h-4 w-4 text-[#25C4B4]" /> 1. Project Metadata
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Configure project name and branch tag for metadata identification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Project Workspace Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. BillingEngine / FinTrack Core"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#2A3547] bg-[#10151F] text-xs text-zinc-100 outline-none focus:border-[#25C4B4] transition-colors"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Defaults to the uploaded folder name if left empty.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Branch Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. main or feature/refactor"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#2A3547] bg-[#10151F] text-xs text-zinc-100 outline-none focus:border-[#25C4B4] transition-colors"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Used for versioning and traceability reports.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drag-and-Drop Intake Zone */}
        <Card className="bg-[#141B27] border-[#2A3547]">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-100">
              <Upload className="h-4 w-4 text-[#25C4B4]" /> 2. Artifact Intake Dropzone
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Drag and drop an entire folder or individual files into the target area below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
                isDragging
                  ? "border-[#25C4B4] bg-[#25C4B4]/10 scale-[1.01]"
                  : "border-[#2A3547] bg-[#10151F]/60 hover:border-[#25C4B4]/60 hover:bg-[#10151F]"
              }`}
              onClick={() => folderRef.current?.click()}
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2A3547] bg-[#192333] text-[#25C4B4] shadow-md">
                <Upload className={`h-6 w-6 transition-transform ${isDragging ? "scale-110 animate-bounce" : ""}`} />
              </div>

              <p className="text-sm font-semibold text-zinc-100">
                {isDragging ? "Drop repository files or folder here" : "Drag and drop project folder or files here"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Or click to browse from local filesystem
              </p>

              {/* Limits and specification pill */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141B27] border border-[#2A3547] text-[11px] font-mono text-zinc-400">
                <span>Limit: 500 files</span>
                <span>•</span>
                <span>Max 500 KB / file</span>
                <span>•</span>
                <span>Text / Code Only</span>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="primary"
                  onClick={() => {
                    folderRef.current?.setAttribute("webkitdirectory", "");
                    folderRef.current?.click();
                  }}
                  disabled={busy}
                  icon={busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FolderInput className="h-4 w-4" />}
                >
                  Choose project folder
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  icon={<FileCode2 className="h-4 w-4" />}
                >
                  Choose individual files
                </Button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".md,.mdx,.txt,.ts,.tsx,.js,.jsx,.py,.java,.go,.rs"
                className="hidden"
                onChange={(e) => void handleIngest(e.target.files)}
              />
              <input
                ref={folderRef}
                type="file"
                multiple
                accept=".md,.mdx,.txt,.ts,.tsx,.js,.jsx,.py,.java,.go,.rs"
                className="hidden"
                onChange={(e) => void handleIngest(e.target.files)}
              />
            </div>

            {/* Supported Formats Legend */}
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase block mb-2 font-mono">
                Supported File Formats & Extractors
              </span>
              <div className="flex flex-wrap gap-1.5">
                {supportedExtensions.map((item) => (
                  <span
                    key={item.ext}
                    className={`text-[10px] px-2 py-0.5 rounded-md border font-mono ${item.color}`}
                  >
                    {item.label} ({item.ext})
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In-Flight Multi-Step Progress State */}
        {busy && (
          <div className="rounded-xl border border-[#25C4B4]/40 bg-[#141B27] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-2 text-[#25C4B4] font-semibold">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {stage || "Processing project artifacts..."}
              </span>
              <span className="text-zinc-400">Step {progressStep} of 4</span>
            </div>

            <div className="w-full bg-[#10151F] rounded-full h-1.5 overflow-hidden border border-[#2A3547]">
              <div
                className="bg-[#25C4B4] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(progressStep / 4) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-zinc-500 pt-1">
              <span className={progressStep >= 1 ? "text-[#25C4B4]" : ""}>1. Intake & Validation</span>
              <span className={progressStep >= 2 ? "text-[#25C4B4]" : ""}>2. Requirement Scan</span>
              <span className={progressStep >= 3 ? "text-[#25C4B4]" : ""}>3. Code Structure</span>
              <span className={progressStep >= 4 ? "text-[#25C4B4]" : ""}>4. Graph Persistence</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 text-xs text-rose-300 shadow-md"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <strong className="text-rose-200">Ingestion Failed</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Successful Result Card */}
        {result && (
          <Card className="border-emerald-800/50 bg-[#141B27] shadow-2xl">
            <CardHeader className="pb-3 border-b border-[#2A3547]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" /> Knowledge Graph Ingested & Active
                </CardTitle>
                <Badge variant="success">Active Workspace</Badge>
              </div>
              <CardDescription className="text-xs text-zinc-300 mt-1">
                Parsed <b>{result.supportedCount}</b> supported files from <b>{result.fileCount}</b> discovered items.
                {result.skippedCount > 0 && (
                  <span className="text-amber-400">
                    {" "}({result.skippedCount} items skipped).
                  </span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Extracted Entity Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  ["Requirements", result.requirementCount],
                  ["Modules", result.moduleCount],
                  ["Functions", result.methodCount],
                  ["Test Suites", result.testCount],
                  ["Trace Edges", result.graph.edges.length],
                ].map(([label, count]) => (
                  <div
                    key={label as string}
                    className="rounded-lg border border-[#2A3547] bg-[#10151F] p-3 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400 font-mono">
                      {label}
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold text-zinc-100">
                      {count}
                    </p>
                  </div>
                ))}
              </div>

              {/* Skipped files expandable drawer */}
              {result.skippedCount > 0 && (
                <div className="rounded-lg border border-[#2A3547] bg-[#10151F] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSkippedDetails((prev) => !prev)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileX className="w-3.5 h-3.5 text-amber-400" />
                      Skipped / Rejected Files Details ({result.skippedCount} items)
                    </span>
                    {showSkippedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showSkippedDetails && (
                    <div className="p-3 border-t border-[#2A3547] space-y-2 text-xs font-mono">
                      {result.unsupportedFiles?.length > 0 && (
                        <div>
                          <span className="text-amber-400 text-[10px] uppercase">
                            Unsupported file types ({result.unsupportedFiles.length}):
                          </span>
                          <p className="text-zinc-400 text-[11px] truncate mt-0.5">
                            {result.unsupportedFiles.slice(0, 10).join(", ")}
                            {result.unsupportedFiles.length > 10 ? ` ...and ${result.unsupportedFiles.length - 10} more` : ""}
                          </p>
                        </div>
                      )}

                      {result.skippedOversized?.length > 0 && (
                        <div>
                          <span className="text-rose-400 text-[10px] uppercase">
                            Oversized files (&gt; 500 KB limit, {result.skippedOversized.length}):
                          </span>
                          <p className="text-zinc-400 text-[11px] truncate mt-0.5">
                            {result.skippedOversized.join(", ")}
                          </p>
                        </div>
                      )}

                      {result.emptyFiles?.length > 0 && (
                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase">
                            Empty files (0 bytes, {result.emptyFiles.length}):
                          </span>
                          <p className="text-zinc-400 text-[11px] truncate mt-0.5">
                            {result.emptyFiles.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Extraction Warnings if any */}
              {result.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Parser Warnings</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90 pl-1">
                    {result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#2A3547]">
                <span className="text-[11px] font-mono text-zinc-400">
                  Graph persisted to browser storage. Ready for exploration.
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    onClick={() => router.push("/graph")}
                    icon={<Network className="h-4 w-4" />}
                    className="flex-1 sm:flex-none"
                  >
                    Explore Knowledge Graph
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/traceability")}
                    icon={<ShieldCheck className="h-4 w-4" />}
                    className="flex-1 sm:flex-none"
                  >
                    Traceability Matrix
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
