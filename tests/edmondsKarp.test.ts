import { describe, it, expect } from "vitest";
import { Graph } from "../src/core/Graph";
import {
  edmondsKarp,
  edmondsKarpGenerator
} from "../src/algorithms/edmondsKarp";
import type { FlowEdge } from "../src/core/types";
import { getNextState } from "./utils/getNextState";

// Helper function to quickly create flow edges for testing
function fEdge(from: number, to: number, capacity: number): FlowEdge<number> {
  return { kind: "flow", from, to, capacity, flow: 0 };
}

describe("Graph Algorithms - Edmonds-Karp Max Flow", () => {
  // A standard flow network for testing:
  // Node 1 (Source) -> 2 (Capacity 10)
  // Node 1 (Source) -> 3 (Capacity 5)
  // Node 2 -> 3 (Capacity 15)
  // Node 2 -> 4 (Sink) (Capacity 5)
  // Node 3 -> 4 (Sink) (Capacity 10)
  // Expected Max Flow: 15
  const buildTestGraph = () => {
    const graph = new Graph<number, true, FlowEdge<number>>(true);
    graph.addEdge(fEdge(1, 2, 10));
    graph.addEdge(fEdge(1, 3, 5));
    graph.addEdge(fEdge(2, 3, 15));
    graph.addEdge(fEdge(2, 4, 5));
    graph.addEdge(fEdge(3, 4, 10));
    return graph;
  };

  describe("Direct Execution", () => {
    it("should compute the correct max flow on a complex directed graph", () => {
      const graph = buildTestGraph();
      const maxFlow = edmondsKarp(graph, 1, 4);

      expect(maxFlow).toBe(15);
    });

    it("should compute the correct max flow on a simple line graph", () => {
      const graph = new Graph<number, true, FlowEdge<number>>(true);
      graph.addEdge(fEdge(1, 2, 5));
      graph.addEdge(fEdge(2, 3, 5));

      const maxFlow = edmondsKarp(graph, 1, 3);
      expect(maxFlow).toBe(5);
    });

    it("should return 0 if the graph is disconnected", () => {
      const graph = new Graph<number, true, FlowEdge<number>>(true);
      graph.addEdge(fEdge(1, 2, 10));
      graph.addNode(3); // Isolated sink node

      const maxFlow = edmondsKarp(graph, 1, 3);
      expect(maxFlow).toBe(0);
    });

    it("should throw an error if the graph is undirected", () => {
      // Cast to bypass TypeScript compilation error for testing the runtime check
      const undirectedGraph = new Graph<number, boolean, FlowEdge<number>>(
        false
      ) as any;
      undirectedGraph.addEdge(fEdge(1, 2, 10));

      expect(() => edmondsKarp(undirectedGraph, 1, 2)).toThrow(
        "Edmonds-Karp algorithm strictly requires a directed graph."
      );
    });
  });

  describe("Generators (Step-by-Step State)", () => {
    it("should yield correct step-by-step states during Edmonds-Karp algorithm", () => {
      // Very simple graph to keep step count manageable: 1 -> 2 (cap 5)
      const graph = new Graph<number, true, FlowEdge<number>>(true);
      graph.addEdge(fEdge(1, 2, 5));

      const generator = edmondsKarpGenerator(graph, 1, 2, true);

      // --- Init State ---
      let state = getNextState(generator);
      expect(state.maxFlow).toBe(0);
      expect(state.currentNode).toBeNull();
      expect(state.residualGraph).toBeNull();

      // --- BFS Started ---
      state = getNextState(generator);
      expect(state.residualVisualState?.currentNode).toBe(1);
      expect(state.residualVisualState?.visitedNodes.has(1)).toBe(true);

      // --- BFS Pop 1 ---
      state = getNextState(generator);
      expect(state.residualVisualState?.currentNode).toBe(1);
      expect(state.residualVisualState?.evaluatingEdge).toBeNull();

      // --- BFS Evaluate 1 -> 2 ---
      state = getNextState(generator);
      expect(state.residualVisualState?.currentNode).toBe(1);
      expect(state.residualVisualState?.evaluatingEdge).toEqual({
        from: 1,
        to: 2
      });

      // --- BFS Queue 2 ---
      state = getNextState(generator);
      expect(state.residualVisualState?.queuedNodes.has(2)).toBe(true);
      expect(state.residualVisualState?.visitedNodes.has(2)).toBe(true);

      // --- BFS Pop 2 (Target Reached) ---
      state = getNextState(generator);
      expect(state.residualVisualState?.currentNode).toBe(2);
      expect(state.residualVisualState?.evaluatingEdge).toBeNull();

      // --- Path Found ---
      state = getNextState(generator);
      expect(state.highlightedEdges.has("1->2")).toBe(true);
      expect(state.maxFlow).toBe(0); // Flow value is not updated yet during path discovery

      // --- Update Flow ---
      state = getNextState(generator);
      expect(state.highlightedEdges.has("1->2")).toBe(true);
      expect(state.maxFlow).toBe(5); // Flow value is now updated

      // --- Next BFS Pass Started (No paths left) ---
      state = getNextState(generator);
      expect(state.residualVisualState?.currentNode).toBe(1);

      // --- BFS Pop 1 ---
      state = getNextState(generator);
      expect(state.residualVisualState?.currentNode).toBe(1);
      expect(state.residualVisualState?.evaluatingEdge).toBeNull();

      // --- Algorithm Finished ---
      state = getNextState(generator);
      expect(state.maxFlow).toBe(5);
      expect(state.residualVisualState).toBeNull(); // Cleaned up upon finish

      // --- Generator Finished ---
      const result = generator.next();
      expect(result.done).toBe(true);
      expect(result.value).toBe(5);
    });
  });
});
