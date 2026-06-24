import { describe, it, expect } from "vitest";
import { parseFlowGraph, parseWeightedGraph } from "../src/io/parser";
import { readGraphFromFileNode } from "../src/io/node-reader";
import { Graph } from "../src/core/Graph";
import type { FlowEdge } from "../src/core/types";
import { edmondsKarp, convertToFlowGraph } from "../src/algorithms/edmondsKarp";

describe("Edmonds-Karp Max Flow Algorithm", () => {
  it("should calculate maximum flow correctly on a simple hand-crafted diamond graph", () => {
    // 0 = s, 1 = A, 2 = B, 3 = t
    const graph = new Graph<number, true, FlowEdge<number>>(true);
    graph.addEdge({ kind: "flow", from: 0, to: 1, flow: 0, capacity: 3 });
    graph.addEdge({ kind: "flow", from: 0, to: 2, flow: 0, capacity: 2 });
    graph.addEdge({ kind: "flow", from: 1, to: 3, flow: 0, capacity: 2 });
    graph.addEdge({ kind: "flow", from: 2, to: 3, flow: 0, capacity: 3 });
    graph.addEdge({ kind: "flow", from: 1, to: 2, flow: 0, capacity: 1 }); // edge between paths

    const maxFlow = edmondsKarp(graph, 0, 3);
    expect(maxFlow).toBe(5);
  });

  it("should find maximum flow = 4 for Fluss.txt from node 0 to node 7", async () => {
    const graph = await parseFlowGraph(
      readGraphFromFileNode("./graphs/flow/Fluss.txt"),
      true
    );

    const maxFlow = edmondsKarp(graph, 0, 7);
    expect(maxFlow).toBe(4);
  });

  it("should find maximum flow = 5 for Fluss2.txt from node 0 to node 7", async () => {
    const graph = await parseFlowGraph(
      readGraphFromFileNode("./graphs/flow/Fluss2.txt"),
      true
    );

    const maxFlow = edmondsKarp(graph, 0, 7);
    expect(maxFlow).toBe(5);
  });

  it("should find maximum flow = 0.75447 for G_1_2.txt considered as capacities from node 0 to node 7", async () => {
    const weightedGraph = await parseWeightedGraph(
      readGraphFromFileNode("./graphs/weighted/G_1_2.txt"),
      true
    );

    const flowGraph = convertToFlowGraph(weightedGraph);

    const maxFlow = edmondsKarp(flowGraph, 0, 7);
    expect(maxFlow).toBeCloseTo(0.75447, 5);
  });
});
