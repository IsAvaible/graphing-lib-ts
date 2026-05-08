import { describe, it, expect } from "vitest";
import { Graph } from "../../src/core/Graph";
import {
  doubleTreeAlgorithm,
  doubleTreeAlgorithmGenerator
} from "../../src/algorithms/tsp/doubleTreeTsp";
import type { WeightedEdge } from "../../src/core/types";

// Helper function to quickly create weighted edges for testing
function wEdge(from: number, to: number, weight: number): WeightedEdge<number> {
  return { kind: "weighted", from, to, weight };
}

describe("Graph Algorithms - Double Tree Algorithm (TSP)", () => {
  // A complete graph satisfying the triangle inequality (Metric TSP)
  // Nodes: 1, 2, 3, 4
  // We explicitly set weights so Kruskal's MST is deterministic:
  // MST Edges: 1-2 (wt 1), 2-3 (wt 2), 1-4 (wt 3) -> Total weight: 6
  // Remaining edges to make it complete: 1-3 (wt 4), 2-4 (wt 5), 3-4 (wt 6)
  const buildCompleteGraph = () => {
    const graph = new Graph<number>(false); // Undirected graph

    graph.addEdge(wEdge(1, 2, 1));
    graph.addEdge(wEdge(2, 3, 2));
    graph.addEdge(wEdge(1, 4, 3));
    graph.addEdge(wEdge(1, 3, 4));
    graph.addEdge(wEdge(2, 4, 5));
    graph.addEdge(wEdge(3, 4, 6));

    return graph;
  };

  describe("Direct Execution", () => {
    it("should compute a valid TSP tour using the Double Tree Algorithm", () => {
      const graph = buildCompleteGraph();
      const tourEdges = doubleTreeAlgorithm(graph);

      // A Hamiltonian cycle for 4 nodes must have exactly 4 edges
      expect(tourEdges).toHaveLength(4);

      // Verify the DFS pre-order path based on the MST:
      // MST structure: 4 - 1 - 2 - 3
      // Pre-order DFS starting at 1:
      // 1 -> 2 (wt 1)
      // 2 -> 3 (wt 2)
      // 3 -> 4 (shortcut, wt 6)
      // 4 -> 1 (closing edge, wt 3)

      expect(tourEdges[0].from).toBe(1);
      expect(tourEdges[0].to).toBe(2);

      expect(tourEdges[1].from).toBe(2);
      expect(tourEdges[1].to).toBe(3);

      expect(tourEdges[2].from).toBe(3);
      expect(tourEdges[2].to).toBe(4);

      expect(tourEdges[3].from).toBe(4);
      expect(tourEdges[3].to).toBe(1); // Cycle closes

      // Total weight of this approximation: 1 + 2 + 6 + 3 = 12
      const totalWeight = tourEdges.reduce((sum, edge) => sum + edge.weight, 0);
      expect(totalWeight).toBe(12);
    });
  });

  describe("Generators (Step-by-Step State)", () => {
    it("should yield the correct step-by-step state during the algorithm", () => {
      const graph = buildCompleteGraph();
      const generator = doubleTreeAlgorithmGenerator(graph);

      // --- STEP 1: MST Computed ---
      let result = generator.next();
      expect(result.done).toBe(false);
      if (result.done) throw new Error("Finished early");
      expect(result.value?.phase).toBe("mst");
      expect(result.value?.mstEdges).toHaveLength(3);
      expect(result.value?.tourNodes).toHaveLength(0);

      // --- STEP 2: DFS Start (Node 1) ---
      result = generator.next();
      expect(result.done).toBe(false);
      if (result.done) throw new Error("Finished early");
      expect(result.value?.phase).toBe("dfs");
      expect(result.value?.evaluatingNode).toBe(1);
      expect(result.value?.evaluatingEdge).toBeNull(); // First node has no incoming shortcut
      expect(result.value?.tourNodes).toEqual([1]);
      expect(result.value?.tourEdges).toHaveLength(0);

      // --- STEP 3: DFS Next (Node 2) ---
      result = generator.next();
      expect(result.done).toBe(false);
      if (result.done) throw new Error("Finished early");
      expect(result.value?.phase).toBe("dfs");
      expect(result.value?.evaluatingNode).toBe(2);
      expect(result.value?.evaluatingEdge?.from).toBe(1);
      expect(result.value?.evaluatingEdge?.to).toBe(2);
      expect(result.value?.evaluatingEdge?.weight).toBe(1); // Standard MST edge
      expect(result.value?.tourNodes).toEqual([1, 2]);
      expect(result.value?.tourEdges).toHaveLength(1);

      // --- STEP 4: DFS Next (Node 3) ---
      result = generator.next();
      expect(result.done).toBe(false);
      if (result.done) throw new Error("Finished early");
      expect(result.value?.phase).toBe("dfs");
      expect(result.value?.evaluatingNode).toBe(3);
      expect(result.value?.evaluatingEdge?.from).toBe(2);
      expect(result.value?.evaluatingEdge?.to).toBe(3);
      expect(result.value?.evaluatingEdge?.weight).toBe(2); // Standard MST edge
      expect(result.value?.tourNodes).toEqual([1, 2, 3]);
      expect(result.value?.tourEdges).toHaveLength(2);

      // --- STEP 5: DFS Shortcut (Node 4) ---
      // Instead of going back 3->2->1->4, the algorithm shortcuts directly 3->4
      result = generator.next();
      expect(result.done).toBe(false);
      if (result.done) throw new Error("Finished early");
      expect(result.value?.phase).toBe("dfs");
      expect(result.value?.evaluatingNode).toBe(4);
      expect(result.value?.evaluatingEdge?.from).toBe(3);
      expect(result.value?.evaluatingEdge?.to).toBe(4);
      expect(result.value?.evaluatingEdge?.weight).toBe(6); // Shortcut edge
      expect(result.value?.tourNodes).toEqual([1, 2, 3, 4]);
      expect(result.value?.tourEdges).toHaveLength(3);

      // --- STEP 6: Completion (Closing the loop) ---
      result = generator.next();
      expect(result.done).toBe(false);
      if (result.done) throw new Error("Finished early");
      expect(result.value?.phase).toBe("complete");
      expect(result.value?.evaluatingNode).toBeNull();
      // Should now have 4 edges (closing edge 4->1 added)
      expect(result.value?.tourEdges).toHaveLength(4);
      expect(result.value?.tourEdges[3].from).toBe(4);
      expect(result.value?.tourEdges[3].to).toBe(1);

      // --- FINISHED ---
      result = generator.next();
      expect(result.done).toBe(true);

      const finalEdges = result.value as WeightedEdge<number>[];
      expect(finalEdges).toHaveLength(4);
    });
  });
});
