import { describe, it, expect } from "vitest";
import { Graph } from "../src/core/Graph";
import {
  primsAlgorithm,
  kruskalsAlgorithm,
  primsAlgorithmGenerator,
  kruskalsAlgorithmGenerator
} from "../src/algorithms/mst";
import type { WeightedEdge } from "../src/core/types";

// Helper function to quickly create weighted edges for testing
function wEdge(from: number, to: number, weight: number): WeightedEdge<number> {
  return { kind: "weighted", from, to, weight };
}

describe("Graph Algorithms - Minimum Spanning Tree (MST)", () => {
  // A standard graph for testing MST:
  // Node 1 to 2 (Weight 1)
  // Node 2 to 3 (Weight 2)
  // Node 1 to 3 (Weight 3) - This should be ignored to form the MST
  const buildTestGraph = () => {
    const graph = new Graph<number>(false); // Undirected graph

    graph.addEdge(wEdge(1, 2, 1));
    graph.addEdge(wEdge(2, 3, 2));
    graph.addEdge(wEdge(1, 3, 3));

    return graph;
  };

  describe("Direct Execution", () => {
    it("should compute the correct MST using Prim's Algorithm", () => {
      const graph = buildTestGraph();
      const mst = primsAlgorithm(graph, 1);

      // MST should contain exactly V - 1 edges (3 - 1 = 2)
      expect(mst).toHaveLength(2);

      // The edges should be the ones with weight 1 and 2 (Total weight = 3)
      const totalWeight = mst.reduce((sum, edge) => sum + edge.weight, 0);
      expect(totalWeight).toBe(3);
    });

    it("should compute the correct MST using Kruskal's Algorithm", () => {
      const graph = buildTestGraph();
      const mst = kruskalsAlgorithm(graph);

      // MST should contain exactly V - 1 edges
      expect(mst).toHaveLength(2);

      // Total weight should also be 3
      const totalWeight = mst.reduce((sum, edge) => sum + edge.weight, 0);
      expect(totalWeight).toBe(3);
    });
  });

  describe("Generators (Step-by-Step State)", () => {
    it("should yield the correct step-by-step state during Prim's Algorithm", () => {
      const graph = buildTestGraph();
      const primGenerator = primsAlgorithmGenerator(graph);

      // --- STEP 1 ---
      // Start at Node 1. Edges available: 1-2 (wt 1) and 1-3 (wt 3).
      // Minimum is 1-2.
      let result = primGenerator.next();
      expect(result.done).toBe(false);
      if (result.done) {
        throw new Error(
          "Expected generator to yield a state, but it finished early."
        );
      }
      expect(result.value?.evaluatingEdge?.weight).toBe(1);
      expect(result.value?.evaluatingEdge?.to).toBe(2);
      expect(result.value?.visitedNodes.has(1)).toBe(true);
      expect(result.value?.visitedNodes.has(2)).toBe(false); // 2 hasn't been added to the set *yet* in the yield state
      expect(result.value?.mstEdges).toHaveLength(0); // Before pushing

      // --- STEP 2 ---
      // Node 2 is visited. Adds edge 2-3 (wt 2).
      // Available in PQ: 1-3 (wt 3), 2-3 (wt 2).
      // Minimum is 2-3.
      result = primGenerator.next();
      expect(result.done).toBe(false);
      if (result.done) {
        throw new Error(
          "Expected generator to yield a state, but it finished early."
        );
      }
      expect(result.value?.evaluatingEdge?.weight).toBe(2);
      expect(result.value?.evaluatingEdge?.to).toBe(3);
      expect(result.value?.visitedNodes.has(2)).toBe(true);
      expect(result.value?.mstEdges).toHaveLength(1);

      // --- STEP 3 ---
      // Node 3 is visited. Adds no new valid edges.
      // Next in PQ is 1-3 (wt 3).
      result = primGenerator.next();
      expect(result.done).toBe(false);
      if (result.done) {
        throw new Error(
          "Expected generator to yield a state, but it finished early."
        );
      }
      expect(result.value?.evaluatingEdge?.weight).toBe(3);
      // The generator will evaluate it, but in the next cycle see it points to visited Node 3 and skip adding it to MST.

      // --- FINISHED ---
      result = primGenerator.next();
      expect(result.done).toBe(true);

      // The return value is the final array of edges
      const finalEdges = result.value as WeightedEdge<number>[];
      expect(finalEdges).toHaveLength(2);
    });

    it("should yield the correct step-by-step state during Kruskal's Algorithm", () => {
      const graph = buildTestGraph();
      const kruskalGenerator = kruskalsAlgorithmGenerator(graph, true);

      // --- STEP 1 ---
      // Globally sorted edges. Smallest is 1-2 (wt 1).
      let result = kruskalGenerator.next();
      expect(result.done).toBe(false);
      if (result.done) {
        throw new Error(
          "Expected generator to yield a state, but it finished early."
        );
      }
      expect(result.value?.evaluatingEdge?.weight).toBe(1);
      expect(result.value?.edgesProcessed).toBe(1);
      expect(result.value?.mstEdges).toHaveLength(0);

      // --- STEP 2 ---
      // Next smallest is 2-3 (wt 2).
      result = kruskalGenerator.next();
      expect(result.done).toBe(false);
      if (result.done) {
        throw new Error(
          "Expected generator to yield a state, but it finished early."
        );
      }
      expect(result.value?.evaluatingEdge?.weight).toBe(2);
      expect(result.value?.edgesProcessed).toBe(2);
      expect(result.value?.mstEdges).toHaveLength(1);

      // --- STEP 3 ---
      // Next smallest is 1-3 (wt 3).
      // The algorithm will yield this state before realizing it creates a cycle.
      result = kruskalGenerator.next();
      expect(result.done).toBe(false);
      if (result.done) {
        throw new Error(
          "Expected generator to yield a state, but it finished early."
        );
      }
      expect(result.value?.evaluatingEdge?.weight).toBe(3);
      expect(result.value?.edgesProcessed).toBe(3);
      expect(result.value?.mstEdges).toHaveLength(2); // Edge 2-3 was added

      // --- FINISHED ---
      result = kruskalGenerator.next();
      expect(result.done).toBe(true);

      if (!result.done) {
        throw new Error(
          "Expected generator to finish, but it yielded instead."
        );
      }

      // The return value is the final array of edges, which should only be 2 because 1-3 formed a cycle
      const finalEdges = result.value;
      expect(finalEdges).toHaveLength(2);
    });
  });
});
