import { describe, it, expect } from "vitest";
import {
  nearestNeighborTsp,
  nearestNeighborTspGenerator
} from "../../src/algorithms/tsp/nearestNeighborTsp";
import { buildCompleteGraph } from "../utils/tspTestHelpers";
import { getNextState } from "../utils/getNextState";

describe("Graph Algorithms - Nearest Neighbor Algorithm (TSP)", () => {
  describe("Direct Execution", () => {
    it("should compute a valid TSP tour using Nearest Neighbor (default start)", () => {
      const graph = buildCompleteGraph();
      const tourEdges = nearestNeighborTsp(graph);

      // Min edge from 1 is to 2 (wt 1). Go to 2.
      // Unvisited: {3,4}. Min edge from 2 is to 3 (wt 2). Go to 3.
      // Unvisited: {4}. Min edge from 3 is to 4 (wt 6). Go to 4.
      // Unvisited: empty. Close loop from 4 to 1 (wt 3).
      expect(tourEdges).toHaveLength(4);
      expect(tourEdges[0].to).toBe(2);
      expect(tourEdges[1].to).toBe(3);
      expect(tourEdges[2].to).toBe(4);
      expect(tourEdges[3].to).toBe(1);

      const totalWeight = tourEdges.reduce((sum, edge) => sum + edge.weight, 0);
      expect(totalWeight).toBe(12);
    });

    it("should compute a valid TSP tour using Nearest Neighbor (custom start node)", () => {
      const graph = buildCompleteGraph();
      const tourEdges = nearestNeighborTsp(graph, 3);

      expect(tourEdges).toHaveLength(4);
      expect(tourEdges[0].to).toBe(2);
      expect(tourEdges[1].to).toBe(1);
      expect(tourEdges[2].to).toBe(4);
      expect(tourEdges[3].to).toBe(3);
    });
  });

  describe("Generators (Step-by-Step State)", () => {
    it("should yield the correct step-by-step state during the algorithm", () => {
      const graph = buildCompleteGraph();
      const generator = nearestNeighborTspGenerator(graph, 1);

      // --- STEP 1: Initialization ---
      let state = getNextState(generator);
      expect(state.phase).toBe("searching");
      expect(state.tourNodes).toEqual([1]);
      expect(state.unvisitedNodes).toEqual(new Set([2, 3, 4]));

      // --- STEP 2: Pick closest to 1 (Node 2) ---
      state = getNextState(generator);
      expect(state.evaluatingNode).toBe(1);
      expect(state.evaluatingEdge?.weight).toBe(1);
      expect(state.tourNodes).toEqual([1, 2]);

      // --- STEP 3: Pick closest to 2 (Node 3) ---
      state = getNextState(generator);
      expect(state.evaluatingNode).toBe(2);
      expect(state.evaluatingEdge?.weight).toBe(2);
      expect(state.tourNodes).toEqual([1, 2, 3]);

      // --- STEP 4: Pick closest to 3 (Node 4) ---
      state = getNextState(generator);
      expect(state.evaluatingNode).toBe(3);
      expect(state.evaluatingEdge?.weight).toBe(6);
      expect(state.tourNodes).toEqual([1, 2, 3, 4]);
      expect(state.unvisitedNodes.size).toBe(0);

      // --- STEP 5: Completion ---
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
