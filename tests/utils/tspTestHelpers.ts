import { Graph } from "../../src/core/Graph";
import type { WeightedEdge } from "../../src/core/types";

// Helper function to quickly create weighted edges for testing
export function wEdge(
  from: number,
  to: number,
  weight: number
): WeightedEdge<number> {
  return { kind: "weighted", from, to, weight };
}

// A complete graph satisfying the triangle inequality (Metric TSP)
// Nodes: 1, 2, 3, 4
// We explicitly set weights so Kruskal's MST is deterministic:
// MST Edges: 1-2 (wt 1), 2-3 (wt 2), 1-4 (wt 3) -> Total weight: 6
// Remaining edges to make it complete: 1-3 (wt 4), 2-4 (wt 5), 3-4 (wt 6)
export const buildCompleteGraph = () => {
  const graph = new Graph<number, false, WeightedEdge<number>>(false);

  graph.addEdge(wEdge(1, 2, 1));
  graph.addEdge(wEdge(2, 3, 2));
  graph.addEdge(wEdge(1, 4, 3));
  graph.addEdge(wEdge(1, 3, 4));
  graph.addEdge(wEdge(2, 4, 5));
  graph.addEdge(wEdge(3, 4, 6));

  return graph;
};
