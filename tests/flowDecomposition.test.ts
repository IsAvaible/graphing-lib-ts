import { describe, it, expect } from "vitest";
import { Graph } from "../src/core/Graph";
import { flowDecomposition } from "../src/algorithms/flowDecomposition";
import type { FlowEdge } from "../src/core/types";

describe("Ford-Fulkerson Flow Decomposition Algorithm", () => {
  it("should decompose a simple path s -> A -> t", () => {
    // 0 is s, 1 is A, 2 is t
    const graph = new Graph<number, true, FlowEdge<number>>(true);
    graph.addEdge({ kind: "flow", from: 0, to: 1, flow: 5, capacity: 10 });
    graph.addEdge({ kind: "flow", from: 1, to: 2, flow: 5, capacity: 10 });

    const result = flowDecomposition(graph);

    expect(result).toHaveLength(1);
    expect(result[0].flow).toBe(5);
    expect(result[0].isCycle).toBe(false);
    expect(result[0].path).toEqual([0, 1, 2]);
  });

  it("should decompose a cycle A -> B -> C -> A", () => {
    // Nodes 0, 1, 2 representing A, B, C
    const graph = new Graph<number, true, FlowEdge<number>>(true);
    graph.addEdge({ kind: "flow", from: 0, to: 1, flow: 3, capacity: 5 });
    graph.addEdge({ kind: "flow", from: 1, to: 2, flow: 3, capacity: 5 });
    graph.addEdge({ kind: "flow", from: 2, to: 0, flow: 3, capacity: 5 });

    const result = flowDecomposition(graph);

    expect(result).toHaveLength(1);
    expect(result[0].flow).toBe(3);
    expect(result[0].isCycle).toBe(true);
    // Cycle could be represented starting at any node depending on search start
    // but it must have length 4 (start node repeated at end)
    expect(result[0].path).toHaveLength(4);
    expect(result[0].path[0]).toBe(result[0].path[result[0].path.length - 1]);
  });

  it("should decompose mixed paths and cycles: s->A->t (flow 4) and cycle B->C->B (flow 2)", () => {
    // 0 = s, 1 = A, 2 = t (path with flow 4)
    // 3 = B, 4 = C (cycle with flow 2)
    const graph = new Graph<number, true, FlowEdge<number>>(true);
    // Path
    graph.addEdge({ kind: "flow", from: 0, to: 1, flow: 4, capacity: 10 });
    graph.addEdge({ kind: "flow", from: 1, to: 2, flow: 4, capacity: 10 });
    // Cycle
    graph.addEdge({ kind: "flow", from: 3, to: 4, flow: 2, capacity: 5 });
    graph.addEdge({ kind: "flow", from: 4, to: 3, flow: 2, capacity: 5 });

    const result = flowDecomposition(graph);

    expect(result).toHaveLength(2);

    const pathComponent = result.find((r) => !r.isCycle);
    const cycleComponent = result.find((r) => r.isCycle);

    expect(pathComponent).toBeDefined();
    expect(pathComponent!.flow).toBe(4);
    expect(pathComponent!.path).toEqual([0, 1, 2]);

    expect(cycleComponent).toBeDefined();
    expect(cycleComponent!.flow).toBe(2);
    expect(cycleComponent!.path).toHaveLength(3); // e.g. [3, 4, 3] or [4, 3, 4]
    expect(cycleComponent!.path[0]).toBe(cycleComponent!.path[2]);
  });

  it("should correctly decompose a complex flow network", () => {
    // Simple diamond network: s -> A -> t, s -> B -> t
    // 0 = s, 1 = A, 2 = B, 3 = t
    const graph = new Graph<number, true, FlowEdge<number>>(true);
    graph.addEdge({ kind: "flow", from: 0, to: 1, flow: 3, capacity: 5 });
    graph.addEdge({ kind: "flow", from: 1, to: 3, flow: 3, capacity: 5 });
    graph.addEdge({ kind: "flow", from: 0, to: 2, flow: 2, capacity: 5 });
    graph.addEdge({ kind: "flow", from: 2, to: 3, flow: 2, capacity: 5 });

    const result = flowDecomposition(graph);

    expect(result).toHaveLength(2);
    const flowSum = result.reduce((sum, r) => sum + r.flow, 0);
    expect(flowSum).toBe(5);

    const path1 = result.find((r) => r.path.includes(1));
    const path2 = result.find((r) => r.path.includes(2));

    expect(path1).toBeDefined();
    expect(path1!.flow).toBe(3);
    expect(path1!.path).toEqual([0, 1, 3]);

    expect(path2).toBeDefined();
    expect(path2!.flow).toBe(2);
    expect(path2!.path).toEqual([0, 2, 3]);
  });
});
