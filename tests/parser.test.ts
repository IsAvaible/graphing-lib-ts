import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { readGraphFromFileNode } from "../src/io/node-reader";
import {
  parseUnweightedGraph,
  parseWeightedGraph,
  parseMinCostFlowGraph
} from "../src/io/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Graph File Parser", () => {
  const unweightedFilePath = path.join(__dirname, "test_unweighted.txt");
  const weightedFilePath = path.join(__dirname, "test_weighted.txt");

  // Create mock files before running the tests
  beforeAll(() => {
    const unweightedData = `15\n0\t6\n0\t9\n0\t13\n1\t4\n`;
    const weightedData = `1000\n0\t753\t0.02075\n753\t506\t0.1877\n`;

    fs.writeFileSync(unweightedFilePath, unweightedData);
    fs.writeFileSync(weightedFilePath, weightedData);
  });

  // Clean up mock files after tests finish
  afterAll(() => {
    if (fs.existsSync(unweightedFilePath)) fs.unlinkSync(unweightedFilePath);
    if (fs.existsSync(weightedFilePath)) fs.unlinkSync(weightedFilePath);
  });

  it("should correctly parse an unweighted graph and initialize all nodes", async () => {
    const graph = await parseUnweightedGraph(
      readGraphFromFileNode(unweightedFilePath)
    );

    // Even though only nodes 0, 1, 4, 6, 9, 13 are in the edges,
    // the graph should have exactly 15 nodes (0 through 14).
    expect(graph.getNodes()).toHaveLength(15);

    const neighborsOf0 = graph.getNeighbors(0);
    expect(neighborsOf0).toHaveLength(3);
    expect(neighborsOf0[0].kind).toBe("unweighted");
    expect(neighborsOf0[0].to).toBe(6);
  });

  it("should correctly parse a weighted graph", async () => {
    const graph = await parseWeightedGraph(
      readGraphFromFileNode(weightedFilePath),
      true
    ); // Treating as directed for test

    expect(graph.getNodes()).toHaveLength(1000);

    const neighborsOf0 = graph.getNeighbors(0);
    expect(neighborsOf0).toHaveLength(1);

    const edge = neighborsOf0[0];
    expect(edge.kind).toBe("weighted");

    if (edge.kind === "weighted") {
      expect(edge.weight).toBe(0.02075);
    }
  });

  it("should correctly parse a min-cost flow graph", async () => {
    const mcfData = [
      "3", // 3 vertices
      "10.0", // balance node 0
      "-2.0", // balance node 1
      "-8.0", // balance node 2
      "0 1 5.0 15.0", // edge 0->1, cost 5.0, capacity 15.0
      "1 2 2.5 10.0" // edge 1->2, cost 2.5, capacity 10.0
    ];

    const graph = await parseMinCostFlowGraph(mcfData, true);

    expect(graph.getNodes()).toHaveLength(3);
    expect(graph.balances?.get(0)).toBe(10.0);
    expect(graph.balances?.get(1)).toBe(-2.0);
    expect(graph.balances?.get(2)).toBe(-8.0);

    const neighborsOf0 = graph.getNeighbors(0);
    expect(neighborsOf0).toHaveLength(1);
    expect(neighborsOf0[0].kind).toBe("flow");
    expect(neighborsOf0[0].to).toBe(1);
    expect(neighborsOf0[0].cost).toBe(5.0);
    expect(neighborsOf0[0].capacity).toBe(15.0);
  });
});
