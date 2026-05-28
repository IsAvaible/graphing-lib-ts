import { describe, it, expect } from "vitest";
import {
  branchAndBoundTsp,
  branchAndBoundTspGenerator
} from "../../src/algorithms/tsp/branchAndBoundTsp";
import { getNextState } from "../utils/getNextState";
import { buildCompleteGraph } from "../utils/tspTestHelpers";

describe("Graph Algorithms - Branch and Bound Algorithm (TSP)", () => {
  describe("Direct Execution", () => {
    it("should compute the exact optimal TSP tour efficiently", () => {
      const graph = buildCompleteGraph();
      const tourEdges = branchAndBoundTsp(graph);

      expect(tourEdges).toHaveLength(4);

      // Due to edge pre-sorting, it optimally tracks 1 -> 2 -> 3 -> 4 -> 1
      expect(tourEdges[0].from).toBe(1);
      expect(tourEdges[0].to).toBe(2);
      expect(tourEdges[1].from).toBe(2);
      expect(tourEdges[1].to).toBe(3);
      expect(tourEdges[2].from).toBe(3);
      expect(tourEdges[2].to).toBe(4);
      expect(tourEdges[3].from).toBe(4);
      expect(tourEdges[3].to).toBe(1);

      // Total weight: 1 + 2 + 6 + 3 = 12
      const totalWeight = tourEdges.reduce((sum, edge) => sum + edge.weight, 0);
      expect(totalWeight).toBe(12);
    });
  });

  describe("Generators (Step-by-Step State)", () => {
    it("should prune expensive branches instead of evaluating all permutations", () => {
      const graph = buildCompleteGraph();
      const generator = branchAndBoundTspGenerator(graph);

      // Initially, it explores down the optimal sorted path
      let state = getNextState(generator);
      expect(state.currentTourNodes).toEqual([1]); // Start node

      state = getNextState(generator);
      expect(state.currentTourNodes).toEqual([1, 2]); // Edge wt 1

      state = getNextState(generator);
      expect(state.currentTourNodes).toEqual([1, 2, 3]); // Edge wt 2

      state = getNextState(generator);
      expect(state.currentTourNodes).toEqual([1, 2, 3, 4]); // Edge wt 6

      // Completion of the first path
      state = getNextState(generator);
      expect(state.currentTourNodes).toEqual([1, 2, 3, 4, 1]);
      expect(state.bestCost).toBe(12);

      // Now it backtracks and starts evaluating other paths, but prunes effectively
      // We loop until the algorithm completes to check pruning stats
      while (state.phase !== "complete") {
        const next = generator.next();
        if (next.done) break;
        state = next.value;
      }

      // The key assertion: Brute Force evaluates 6 full paths.
      // Branch and Bound should prune at least 1-2 branches due to the `currentCost >= 12` check.
      expect(state.branchesPruned).toBeGreaterThan(0);
      expect(state.bestCost).toBe(12);
    });
  });
});
