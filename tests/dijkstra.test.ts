import { describe, it, expect } from "vitest";
import { Graph } from "../src/core/Graph";
import { dijkstra, dijkstraGenerator } from "../src/algorithms/sssp/dijkstra";
import type { WeightedEdge } from "../src/core/types";
import { getNextState } from "./utils/getNextState";

// Helper function to quickly create weighted edges for testing
function wEdge(from: number, to: number, weight: number): WeightedEdge<number> {
  return { kind: "weighted", from, to, weight };
}

describe("Graph Algorithms - Dijkstra Shortest Path", () => {
  // A standard weighted graph for testing shortest paths:
  // Node 1 -> 2 (Weight 1)
  // Node 2 -> 3 (Weight 2)
  // Node 1 -> 3 (Weight 4) - The shortest path to 3 should go through 2 (weight 3)
  const buildTestGraph = (isDirected: boolean = false) => {
    const graph = new Graph<number, boolean, WeightedEdge<number>>(isDirected);
    graph.addEdge(wEdge(1, 2, 1));
    graph.addEdge(wEdge(2, 3, 2));
    graph.addEdge(wEdge(1, 3, 4));
    return graph;
  };

  describe("Direct Execution", () => {
    it("should compute the correct shortest paths on an undirected graph", () => {
      const graph = buildTestGraph(false);
      const { distances, predecessors } = dijkstra(graph, 1);

      expect(distances.get(1)).toBe(0);
      expect(distances.get(2)).toBe(1);
      expect(distances.get(3)).toBe(3); // 1 -> 2 -> 3 is weight 3

      expect(predecessors.get(1)).toBeNull();
      expect(predecessors.get(2)).toBe(1);
      expect(predecessors.get(3)).toBe(2);
    });

    it("should compute the correct shortest paths on a directed graph", () => {
      const graph = buildTestGraph(true);
      const { distances, predecessors } = dijkstra(graph, 1);

      expect(distances.get(1)).toBe(0);
      expect(distances.get(2)).toBe(1);
      expect(distances.get(3)).toBe(3); // 1 -> 2 -> 3 is weight 3

      expect(predecessors.get(1)).toBeNull();
      expect(predecessors.get(2)).toBe(1);
      expect(predecessors.get(3)).toBe(2);
    });

    it("should handle disconnected graphs properly", () => {
      const graph = new Graph<number, boolean, WeightedEdge<number>>(true);
      graph.addEdge(wEdge(1, 2, 1));
      graph.addNode(3); // isolated node

      const { distances, predecessors } = dijkstra(graph, 1);

      expect(distances.get(1)).toBe(0);
      expect(distances.get(2)).toBe(1);
      expect(distances.get(3)).toBe(Infinity);

      expect(predecessors.get(1)).toBeNull();
      expect(predecessors.get(2)).toBe(1);
      expect(predecessors.get(3)).toBeNull();
    });
  });

  describe("Generators (Step-by-Step State)", () => {
    it("should yield correct step-by-step states during Dijkstra's Algorithm", () => {
      const graph = buildTestGraph(true);
      const generator = dijkstraGenerator(graph, 1);

      // --- Pop Node 1 ---
      let state = getNextState(generator);
      expect(state.currentNode).toBe(1);
      expect(state.visitedNodes.has(1)).toBe(true);
      expect(state.distances.get(1)).toBe(0);
      expect(state.evaluatingEdge).toBeNull();

      // --- Evaluate edge 1 -> 2 ---
      state = getNextState(generator);
      expect(state.currentNode).toBe(1);
      expect(state.evaluatingEdge?.to).toBe(2);
      expect(state.evaluatingEdge?.weight).toBe(1);

      // --- Relax edge 1 -> 2 (Update node 2 distance to 1) ---
      state = getNextState(generator);
      expect(state.distances.get(2)).toBe(1);
      expect(state.predecessors.get(2)).toBe(1);

      // --- Evaluate edge 1 -> 3 ---
      state = getNextState(generator);
      expect(state.currentNode).toBe(1);
      expect(state.evaluatingEdge?.to).toBe(3);
      expect(state.evaluatingEdge?.weight).toBe(4);

      // --- Relax edge 1 -> 3 (Update node 3 distance to 4) ---
      state = getNextState(generator);
      expect(state.distances.get(3)).toBe(4);
      expect(state.predecessors.get(3)).toBe(1);

      // --- Pop Node 2 (dist = 1) ---
      state = getNextState(generator);
      expect(state.currentNode).toBe(2);
      expect(state.visitedNodes.has(2)).toBe(true);
      expect(state.evaluatingEdge).toBeNull();

      // --- Evaluate edge 2 -> 3 ---
      state = getNextState(generator);
      expect(state.currentNode).toBe(2);
      expect(state.evaluatingEdge?.to).toBe(3);
      expect(state.evaluatingEdge?.weight).toBe(2);

      // --- Relax edge 2 -> 3 (Update node 3 distance to 3) ---
      state = getNextState(generator);
      expect(state.distances.get(3)).toBe(3);
      expect(state.predecessors.get(3)).toBe(2);

      // --- Pop Node 3 (dist = 3) ---
      state = getNextState(generator);
      expect(state.currentNode).toBe(3);
      expect(state.visitedNodes.has(3)).toBe(true);
      expect(state.evaluatingEdge).toBeNull();

      // --- Clear state upon completion ---
      state = getNextState(generator);
      expect(state.currentNode).toBeNull();
      expect(state.evaluatingEdge).toBeNull();

      // --- Generator Finished ---
      const result = generator.next();
      expect(result.done).toBe(true);
      expect(result.value.distances.get(3)).toBe(3);
    });
  });
});
