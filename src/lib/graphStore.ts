import { KnowledgeGraphData } from "@/types/graph";
const KEY = "graphtrace.imported-graph.v1";
export function saveImportedGraph(graph: KnowledgeGraphData) { if(typeof window!=="undefined") window.localStorage.setItem(KEY,JSON.stringify(graph)); }
export function getImportedGraph(): KnowledgeGraphData|null {
  if(typeof window==="undefined") return null;
  try { const graph=JSON.parse(window.localStorage.getItem(KEY)??"null") as KnowledgeGraphData|null; return graph&&Array.isArray(graph.nodes)&&Array.isArray(graph.edges)?graph:null; } catch { return null; }
}
