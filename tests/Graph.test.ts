import { describe, it, expect } from "vitest";
import { Graph } from "../src/core/Graph";
import type { UnweightedEdge, WeightedEdge } from "../src/core/types";

describe("Core Graph Structure", () => {
  it("should allow adding generic node types (e.g., strings)", () => {
    const graph = new Graph<string>();
    graph.addNode("Aachen");
    graph.addNode("Cologne");

    const nodes = graph.getNodes();
    expect(nodes).toHaveLength(2);
    expect(nodes).toContain("Aachen");
    expect(nodes).toContain("Cologne");
  });

  it("should correctly mirror edges in an undirected graph", () => {
    const graph = new Graph<number>(false);

    const edge: UnweightedEdge<number> = { kind: "unweighted", to: 2 };
    graph.addEdge(1, edge);

    // Node 1 should point to Node 2
    const neighborsOf1 = graph.getNeighbors(1);
    expect(neighborsOf1).toHaveLength(1);
    expect(neighborsOf1[0].to).toBe(2);

    // Node 2 should automatically point back to Node 1
    const neighborsOf2 = graph.getNeighbors(2);
    expect(neighborsOf2).toHaveLength(1);
    expect(neighborsOf2[0].to).toBe(1);
    expect(neighborsOf2[0].kind).toBe("unweighted");
  });

  it("should NOT mirror edges in a directed graph", () => {
    const graph = new Graph<string>(true); // true = directed

    const edge: WeightedEdge<string> = {
      kind: "weighted",
      to: "B",
      weight: 10
    };
    graph.addEdge("A", edge);

    expect(graph.getNeighbors("A")).toHaveLength(1);
    expect(graph.getNeighbors("A")[0].kind).toBe("weighted");

    // B should have no outward edges
    expect(graph.getNeighbors("B")).toHaveLength(0);
  });
});
