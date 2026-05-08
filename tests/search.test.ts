import { describe, it, expect } from "vitest";
import { Graph } from "../src/core/Graph";
import {
  countConnectedComponents,
  breadthFirstSearch
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
});
