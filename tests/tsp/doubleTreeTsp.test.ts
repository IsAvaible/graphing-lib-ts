import { describe, it, expect } from "vitest";
import {
  doubleTreeAlgorithm,
  doubleTreeAlgorithmGenerator
} from "../../src/algorithms/tsp/doubleTreeTsp";
import { getNextState } from "../utils/getNextState";
import { buildCompleteGraph } from "../utils/tspTestHelpers";

describe("Graph Algorithms - Double Tree Algorithm (TSP)", () => {
  describe("Direct Execution", () => {
    it("should compute a valid TSP tour using the Double Tree Algorithm", () => {
      const graph = buildCompleteGraph();
      const tourEdges = doubleTreeAlgorithm(graph);

      expect(tourEdges).toHaveLength(4);

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
      expect(tourEdges[3].to).toBe(1);

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
      let state = getNextState(generator);
      expect(state.phase).toBe("mst");
      expect(state.mstEdges).toHaveLength(3);
      expect(state.tourNodes).toHaveLength(0);

      // --- STEP 2: DFS Start (Node 1) ---
      state = getNextState(generator);
      expect(state.phase).toBe("dfs");
      expect(state.evaluatingNode).toBe(1);
      expect(state.evaluatingEdge).toBeNull(); // First node has no incoming shortcut
      expect(state.tourNodes).toEqual([1]);

      // --- STEP 3: DFS Next (Node 2) ---
      state = getNextState(generator);
      expect(state.evaluatingNode).toBe(2);
      expect(state.evaluatingEdge?.weight).toBe(1); // Standard MST edge
      expect(state.tourNodes).toEqual([1, 2]);

      // --- STEP 4: DFS Next (Node 3) ---
      state = getNextState(generator);
      expect(state.evaluatingNode).toBe(3);
      expect(state.evaluatingEdge?.weight).toBe(2);
      expect(state.tourNodes).toEqual([1, 2, 3]);

      // --- STEP 5: DFS Shortcut (Node 4) ---
      state = getNextState(generator);
      expect(state.evaluatingNode).toBe(4);
      expect(state.evaluatingEdge?.weight).toBe(6); // Shortcut edge
      expect(state.tourNodes).toEqual([1, 2, 3, 4]);

      // --- STEP 6: Completion ---
      state = getNextState(generator);
      expect(state.phase).toBe("complete");
      expect(state.tourEdges).toHaveLength(4);

      // --- FINISHED ---
      const finalResult = generator.next();
      expect(finalResult.done).toBe(true);
      expect(finalResult.value).toHaveLength(4);
    });
  });
});
