import { describe, it, expect } from "vitest";
import { Graph } from "../src/core/Graph";
import {
  bellmanFord,
  bellmanFordGenerator
} from "../src/algorithms/sssp/bellmanFord";
import type { WeightedEdge } from "../src/core/types";
import { getNextState } from "./utils/getNextState";

// Helper function to quickly create weighted edges for testing
function wEdge(from: number, to: number, weight: number): WeightedEdge<number> {
  return { kind: "weighted", from, to, weight };
}

describe("Graph Algorithms - Bellman-Ford Shortest Path", () => {
  // A standard weighted graph for testing shortest paths:
  // Node 1 -> 2 (Weight 1)
  // Node 2 -> 3 (Weight 2)
  // Node 1 -> 3 (Weight 4)
  const buildTestGraph = (isDirected: boolean = false) => {
    const graph = new Graph<number, boolean, WeightedEdge<number>>(isDirected);
    graph.addEdge(wEdge(1, 2, 1));
    graph.addEdge(wEdge(2, 3, 2));
    graph.addEdge(wEdge(1, 3, 4));
    return graph;
  };

  describe("Direct Execution", () => {
    it("should compute the correct shortest paths on an undirected graph (positive weights)", () => {
      const graph = buildTestGraph(false);
      const { distances, predecessors } = bellmanFord(graph, 1);

      expect(distances.get(1)).toBe(0);
      expect(distances.get(2)).toBe(1);
      expect(distances.get(3)).toBe(3); // 1 -> 2 -> 3 is weight 3

      expect(predecessors.get(1)).toBeNull();
      expect(predecessors.get(2)).toBe(1);
      expect(predecessors.get(3)).toBe(2);
    });

    it("should compute the correct shortest paths on a directed graph (positive weights)", () => {
      const graph = buildTestGraph(true);
      const { distances, predecessors } = bellmanFord(graph, 1);

      expect(distances.get(1)).toBe(0);
      expect(distances.get(2)).toBe(1);
      expect(distances.get(3)).toBe(3); // 1 -> 2 -> 3 is weight 3

      expect(predecessors.get(1)).toBeNull();
      expect(predecessors.get(2)).toBe(1);
      expect(predecessors.get(3)).toBe(2);
    });

    it("should handle negative edge weights correctly (no negative cycle)", () => {
      // Node 1 -> 2 (Weight 4)
      // Node 1 -> 3 (Weight 3)
      // Node 2 -> 3 (Weight -2)
      // Path 1 -> 2 -> 3 is 4 + (-2) = 2, which is better than 1 -> 3 (weight 3)
      const graph = new Graph<number, boolean, WeightedEdge<number>>(true);
      graph.addEdge(wEdge(1, 2, 4));
      graph.addEdge(wEdge(1, 3, 3));
      graph.addEdge(wEdge(2, 3, -2));

      const { distances, predecessors } = bellmanFord(graph, 1);

      expect(distances.get(1)).toBe(0);
      expect(distances.get(2)).toBe(4);
      expect(distances.get(3)).toBe(2); // 1 -> 2 -> 3 is weight 2

      expect(predecessors.get(1)).toBeNull();
      expect(predecessors.get(2)).toBe(1);
      expect(predecessors.get(3)).toBe(2);
    });

    it("should handle disconnected graphs properly", () => {
      const graph = new Graph<number, boolean, WeightedEdge<number>>(true);
      graph.addEdge(wEdge(1, 2, 1));
      graph.addNode(3); // isolated node

      const { distances, predecessors } = bellmanFord(graph, 1);

      expect(distances.get(1)).toBe(0);
      expect(distances.get(2)).toBe(1);
      expect(distances.get(3)).toBe(Infinity);

      expect(predecessors.get(1)).toBeNull();
      expect(predecessors.get(2)).toBe(1);
      expect(predecessors.get(3)).toBeNull();
    });

    it("should throw an error if a negative-weight cycle is detected", () => {
      // Node 1 -> 2 (Weight 2)
      // Node 2 -> 3 (Weight 3)
      // Node 3 -> 1 (Weight -6)
      // Cycle: 1 -> 2 -> 3 -> 1 (weight 2 + 3 - 6 = -1)
      const graph = new Graph<number, boolean, WeightedEdge<number>>(true);
      graph.addEdge(wEdge(1, 2, 2));
      graph.addEdge(wEdge(2, 3, 3));
      graph.addEdge(wEdge(3, 1, -6));

      expect(() => {
        bellmanFord(graph, 1);
      }).toThrow("Negative weight cycle detected.");
    });
  });

  describe("Generators (Step-by-Step State)", () => {
    it("should yield correct step-by-step states during Bellman-Ford's Algorithm", () => {
      const graph = new Graph<number, boolean, WeightedEdge<number>>(true);
      graph.addEdge(wEdge(1, 2, 1));
      graph.addEdge(wEdge(2, 3, 2));

      const generator = bellmanFordGenerator(graph, 1);

      // --- Initialization (Step 0) ---
      let state = getNextState(generator);
      expect(state.currentNode).toBeNull();
      expect(state.evaluatingEdge).toBeNull();
      expect(state.distances.get(1)).toBe(0);
      expect(state.distances.get(2)).toBe(Infinity);
      expect(state.distances.get(3)).toBe(Infinity);
      expect(state.iteration).toBe(0);

      // --- Iteration 1 ---
      // Evaluate edge 1 -> 2
      state = getNextState(generator);
      expect(state.currentNode).toBe(1);
      expect(state.evaluatingEdge?.to).toBe(2);
      expect(state.evaluatingEdge?.weight).toBe(1);
      expect(state.iteration).toBe(1);

      // Relax edge 1 -> 2 (updates distance of 2 to 1)
      state = getNextState(generator);
      expect(state.distances.get(2)).toBe(1);
      expect(state.predecessors.get(2)).toBe(1);
      expect(state.iteration).toBe(1);

      // Evaluate edge 2 -> 3
      state = getNextState(generator);
      expect(state.currentNode).toBe(2);
      expect(state.evaluatingEdge?.to).toBe(3);
      expect(state.evaluatingEdge?.weight).toBe(2);
      expect(state.iteration).toBe(1);

      // Relax edge 2 -> 3 (updates distance of 3 to 3)
      state = getNextState(generator);
      expect(state.distances.get(3)).toBe(3);
      expect(state.predecessors.get(3)).toBe(2);
      expect(state.iteration).toBe(1);

      // --- Iteration 2 ---
      // Since all nodes were relaxed and we check again, it checks 1 -> 2
      state = getNextState(generator);
      expect(state.currentNode).toBe(1);
      expect(state.evaluatingEdge?.to).toBe(2);
      expect(state.iteration).toBe(2);

      // Evaluate edge 2 -> 3
      state = getNextState(generator);
      expect(state.currentNode).toBe(2);
      expect(state.evaluatingEdge?.to).toBe(3);
      expect(state.iteration).toBe(2);

      // No changes in iteration 2, so it terminates the relaxation phases and checks for negative cycle.
      // Negative Cycle Check (Iteration V = 3)
      // Check edge 1 -> 2
      state = getNextState(generator);
      expect(state.currentNode).toBe(1);
      expect(state.evaluatingEdge?.to).toBe(2);
      expect(state.iteration).toBe(3); // V = 3

      // Check edge 2 -> 3
      state = getNextState(generator);
      expect(state.currentNode).toBe(2);
      expect(state.evaluatingEdge?.to).toBe(3);
      expect(state.iteration).toBe(3);

      // Clear state upon completion
      state = getNextState(generator);
      expect(state.currentNode).toBeNull();
      expect(state.evaluatingEdge).toBeNull();
      expect(state.iteration).toBe(3);

      // Generator Finished
      const result = generator.next();
      expect(result.done).toBe(true);
      expect(result.value.distances.get(3)).toBe(3);
    });

    it("should throw in generator when negative cycle is detected", () => {
      const graph = new Graph<number, boolean, WeightedEdge<number>>(true);
      graph.addEdge(wEdge(1, 2, 2));
      graph.addEdge(wEdge(2, 3, 3));
      graph.addEdge(wEdge(3, 1, -6));

      const generator = bellmanFordGenerator(graph, 1);

      // We can exhaust/run the generator until it throws
      expect(() => {
        let res = generator.next();
        while (!res.done) {
          res = generator.next();
        }
      }).toThrow("Negative weight cycle detected.");
    });
  });
});
