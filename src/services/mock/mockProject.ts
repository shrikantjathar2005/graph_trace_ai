import { ProjectMetadata } from "@/types/api";

export const mockProjectMetadata: ProjectMetadata = {
  id: "proj-fintrack-core",
  name: "FinTrack Banking Core",
  repositoryUrl: "https://github.com/enterprise/fintrack-banking-core",
  defaultBranch: "main",
  commitHash: "d92e3a1f",
  languages: ["TypeScript", "Python", "Go"],
  totalFilesParsed: 284,
  totalLoc: 48920,
  lastIndexedAt: "2026-09-11T18:45:00Z",
  indexStatus: {
    m1Parser: "COMPLETED",
    m2Neo4j: "CONNECTED",
    m3Reasoning: "ACTIVE",
  },
  entityCounts: {
    requirement: 12,
    architecture: 5,
    component: 14,
    module: 28,
    class: 64,
    method: 186,
    test: 142,
    documentation: 16,
  },
};
