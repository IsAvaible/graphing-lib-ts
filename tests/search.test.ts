import { describe, it, expect } from "vitest";
import { Graph } from "../src/core/Graph";
import {
  countConnectedComponents,
  breadthFirstSearch,
  depthFirstSearch
} from "../src/algorithms/search";
import type { UnweightedEdge } from "../src/core/types";

// Helper function to quickly create unweighted edges for testing
function edge(from: number, to: number): UnweightedEdge<number> {
  return { kind: "unweighted", from, to };
}

describe("Graph Algorithms - Search", () => {
  it("should correctly count connected components", () => {
    const graph = new Graph<number>(false);

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
    const graph = new Graph<number>(false);
    // A simple V-shape: 1 connects to 2 and 3.
    graph.addEdge(edge(1, 2));
    graph.addEdge(edge(1, 3));

    // Initialize the generator
    const bfsGenerator = breadthFirstSearch(graph, 1);

    // The algorithm starts at Node 1.
    let result = bfsGenerator.next();
    expect(result.done).toBe(false);
    if (result.done) throw new Error("Finished early");
    expect(result.value?.currentNode).toBe(1);
    expect(result.value?.visitedNodes.has(1)).toBe(true);

    // The algorithm moves to the first neighbor (Node 2)
    result = bfsGenerator.next();
    expect(result.done).toBe(false);
    if (result.done) throw new Error("Finished early");
    expect(result.value?.currentNode).toBe(2);
    expect(result.value?.visitedNodes.has(2)).toBe(true);
    expect(result.value?.queue).toContain(3);

    // The algorithm moves to the second neighbor (Node 3)
    result = bfsGenerator.next();
    expect(result.done).toBe(false);
    if (result.done) throw new Error("Finished early");
    expect(result.value?.currentNode).toBe(3);
    expect(result.value?.visitedNodes.has(3)).toBe(true);
    expect(result.value?.queue).toHaveLength(0); // Queue is now empty

    // --- FINISHED ---
    // The generator should now be exhausted
    result = bfsGenerator.next();
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
    let result = dfsGenerator.next();
    expect(result.done).toBe(false);
    if (result.done) throw new Error("Finished early");
    expect(result.value?.currentNode).toBe(1);
    expect(result.value?.visitedNodes.has(1)).toBe(true);
    expect(result.value?.stack).toHaveLength(0);

    // The algorithm pops Node 2. Stack has [3]. It pushes 5, then 4.
    result = dfsGenerator.next();
    expect(result.done).toBe(false);
    if (result.done) throw new Error("Finished early");
    expect(result.value?.currentNode).toBe(2);
    expect(result.value?.visitedNodes.has(2)).toBe(true);
    expect(result.value?.stack).toStrictEqual([3]);

    // The algorithm pops Node 4. Stack has [3, 5]. No new neighbors to push.
    result = dfsGenerator.next();
    expect(result.done).toBe(false);
    if (result.done) throw new Error("Finished early");
    expect(result.value?.currentNode).toBe(4);
    expect(result.value?.visitedNodes.has(4)).toBe(true);
    expect(result.value?.stack).toStrictEqual([3, 5]);

    // The algorithm pops Node 5. Stack has [3]. No new neighbors to push.
    result = dfsGenerator.next();
    expect(result.done).toBe(false);
    if (result.done) throw new Error("Finished early");
    expect(result.value?.currentNode).toBe(5);
    expect(result.value?.visitedNodes.has(5)).toBe(true);
    expect(result.value?.stack).toStrictEqual([3]);

    // The algorithm pops Node 3. Stack has []. No new neighbors to push.
    result = dfsGenerator.next();
    expect(result.done).toBe(false);
    if (result.done) throw new Error("Finished early");
    expect(result.value?.currentNode).toBe(3);
    expect(result.value?.visitedNodes.has(3)).toBe(true);
    expect(result.value?.stack).toStrictEqual([]);

    // --- FINISHED ---
    // The generator should now be exhausted
    result = dfsGenerator.next();
    expect(result.done).toBe(true);
    expect(result.value).toStrictEqual(new Set([1, 2, 4, 5, 3]));
  });
});
