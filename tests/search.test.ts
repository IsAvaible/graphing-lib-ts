import { describe, it, expect } from "vitest";
import { Graph } from "../src/core/Graph";
import {
  countConnectedComponents,
  breadthFirstSearch,
  depthFirstSearch
} from "../src/algorithms/search";
import type { UnweightedEdge } from "../src/core/types";
import { getNextState } from "./utils/getNextState";

// Helper function to quickly create unweighted edges for testing
function edge(from: number, to: number): UnweightedEdge<number> {
  return { kind: "unweighted", from, to };
}

describe("Graph Algorithms - Search", () => {
  it("should correctly count connected components", () => {
    const graph = new Graph(false);

    // Component 1: 1-2-3 (Triangle)
    graph.addEdge(edge(1, 2));
    graph.addEdge(edge(2, 3));
    graph.addEdge(edge(3, 1));

    // Component 2: 4-5 (Line)
    graph.addEdge(edge(4, 5));

    // Component 3: 6 (Isolated)
    graph.addNode(6);

    expect(countConnectedComponents(graph)).toBe(3);
  });

  it("should yield the correct step-by-step state during a BFS", () => {
    const graph = new Graph(false);
    // A simple V-shape: 1 connects to 2 and 3.
    graph.addEdge(edge(1, 2));
    graph.addEdge(edge(1, 3));

    // Initialize the generator
    const bfsGenerator = breadthFirstSearch(graph, 1);

    // The algorithm starts at Node 1.
    let state = getNextState(bfsGenerator);
    expect(state.currentNode).toBe(1);
    expect(state.visitedNodes.has(1)).toBe(true);

    // The algorithm moves to the first neighbor (Node 2)
    state = getNextState(bfsGenerator);
    expect(state.currentNode).toBe(2);
    expect(state.visitedNodes.has(2)).toBe(true);
    expect(state.queue).toContain(3);

    // The algorithm moves to the second neighbor (Node 3)
    state = getNextState(bfsGenerator);
    expect(state.currentNode).toBe(3);
    expect(state.visitedNodes.has(3)).toBe(true);
    expect(state.queue).toHaveLength(0); // Queue is now empty

    // --- FINISHED ---
    // The generator should now be exhausted
    const result = bfsGenerator.next();
    expect(result.done).toBe(true);
    expect(result.value).toStrictEqual(new Set([1, 2, 3]));
  });

  it("should yield the correct step-by-step state during a DFS", () => {
    const graph = new Graph<number>(false);
    // A simple tree structure:
    //      1
    //     / \
    //    2   3
    //   / \
    //  4   5
    graph.addEdge(edge(1, 2));
    graph.addEdge(edge(1, 3));
    graph.addEdge(edge(2, 4));
    graph.addEdge(edge(2, 5));

    // Initialize the generator
    const dfsGenerator = depthFirstSearch(graph, 1);

    // The algorithm pops Node 1. Stack is empty, then it pushes 3, then 2.
    let state = getNextState(dfsGenerator);
    expect(state.currentNode).toBe(1);
    expect(state.visitedNodes.has(1)).toBe(true);
    expect(state.stack).toHaveLength(0);

    // The algorithm pops Node 2. Stack has [3]. It pushes 5, then 4.
    state = getNextState(dfsGenerator);
    expect(state.currentNode).toBe(2);
    expect(state.visitedNodes.has(2)).toBe(true);
    expect(state.stack).toStrictEqual([3]);

    // The algorithm pops Node 4. Stack has [3, 5]. No new neighbors to push.
    state = getNextState(dfsGenerator);
    expect(state.currentNode).toBe(4);
    expect(state.visitedNodes.has(4)).toBe(true);
    expect(state.stack).toStrictEqual([3, 5]);

    // The algorithm pops Node 5. Stack has [3]. No new neighbors to push.
    state = getNextState(dfsGenerator);
    expect(state.currentNode).toBe(5);
    expect(state.visitedNodes.has(5)).toBe(true);
    expect(state.stack).toStrictEqual([3]);

    // The algorithm pops Node 3. Stack has []. No new neighbors to push.
    state = getNextState(dfsGenerator);
    expect(state.currentNode).toBe(3);
    expect(state.visitedNodes.has(3)).toBe(true);
    expect(state.stack).toStrictEqual([]);

    // --- FINISHED ---
    // The generator should now be exhausted
    const result = dfsGenerator.next();
    expect(result.done).toBe(true);
    expect(result.value).toStrictEqual(new Set([1, 2, 4, 5, 3]));
  });
});
