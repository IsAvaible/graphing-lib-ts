import { describe, it, expect } from "vitest";
import {
  bruteForceTsp,
  bruteForceTspGenerator
} from "../../src/algorithms/tsp/bruteForceTsp";
import { getNextState } from "../utils/getNextState";
import { buildCompleteGraph } from "../utils/tspTestHelpers";

describe("Graph Algorithms - Brute-Force Algorithm (TSP)", () => {
  describe("Direct Execution", () => {
    it("should compute the exact optimal TSP tour", () => {
      const graph = buildCompleteGraph();
      const tourEdges = bruteForceTsp(graph);

      expect(tourEdges).toHaveLength(4);

      // The algorithm anchors on Node 1 and iterates in insertion order: 1, 2, 3, 4.
      // The first full permutation is 1 -> 2 -> 3 -> 4 -> 1 (Cost 12)
      // The exact reverse path 1 -> 4 -> 3 -> 2 -> 1 is also evaluated last but is not strictly lesser (<).
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
    it("should yield the correct step-by-step state evaluating all permutations", () => {
      const graph = buildCompleteGraph();
      const generator = bruteForceTspGenerator(graph);

      // --- PERMUTATION 1: 1 -> 2 -> 3 -> 4 -> 1 ---
      // Expected Cost: 1 + 2 + 6 + 3 = 12
      let state = getNextState(generator);
      expect(state.phase).toBe("evaluating");
      expect(state.permutationsEvaluated).toBe(1);
      expect(state.currentTourNodes).toEqual([1, 2, 3, 4, 1]);
      expect(state.currentCost).toBe(12);
      expect(state.bestCost).toBe(12);

      // --- PERMUTATION 2: 1 -> 2 -> 4 -> 3 -> 1 ---
      // Expected Cost: 1 + 5 + 6 + 4 = 16
      state = getNextState(generator);
      expect(state.permutationsEvaluated).toBe(2);
      expect(state.currentTourNodes).toEqual([1, 2, 4, 3, 1]);
      expect(state.currentCost).toBe(16);
      expect(state.bestCost).toBe(12); // Best remains 12

      // --- PERMUTATION 3: 1 -> 3 -> 2 -> 4 -> 1 ---
      // Expected Cost: 4 + 2 + 5 + 3 = 14
      state = getNextState(generator);
      expect(state.permutationsEvaluated).toBe(3);
      expect(state.currentCost).toBe(14);
      expect(state.bestCost).toBe(12);

      // --- PERMUTATION 4: 1 -> 3 -> 4 -> 2 -> 1 ---
      // Expected Cost: 4 + 6 + 5 + 1 = 16
      state = getNextState(generator);
      expect(state.permutationsEvaluated).toBe(4);
      expect(state.currentCost).toBe(16);

      // --- PERMUTATION 5: 1 -> 4 -> 2 -> 3 -> 1 ---
      // Expected Cost: 3 + 5 + 2 + 4 = 14
      state = getNextState(generator);
      expect(state.permutationsEvaluated).toBe(5);
      expect(state.currentCost).toBe(14);

      // --- PERMUTATION 6: 1 -> 4 -> 3 -> 2 -> 1 ---
      // Expected Cost: 3 + 6 + 2 + 1 = 12
      state = getNextState(generator);
      expect(state.permutationsEvaluated).toBe(6);
      expect(state.currentCost).toBe(12);
      expect(state.bestCost).toBe(12); // Ties the best score

      // --- COMPLETION PHASE ---
      state = getNextState(generator);
      expect(state.phase).toBe("complete");
      expect(state.permutationsEvaluated).toBe(6);
      expect(state.bestCost).toBe(12);
      expect(state.bestTourNodes).toEqual([1, 2, 3, 4, 1]); // Preserves the first found optimal path

      // --- FINISHED ---
      const finalResult = generator.next();
      expect(finalResult.done).toBe(true);
      expect(finalResult.value).toHaveLength(4);

      // Verify total permutations is strictly (n-1)! -> 3! = 6
      expect(state.permutationsEvaluated).toBe(6);
    });
  });
});
