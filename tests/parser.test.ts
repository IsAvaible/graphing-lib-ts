import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { readGraphFromFile } from "../src/io/parser";

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
    const graph = await readGraphFromFile(unweightedFilePath, false);

    // Even though only nodes 0, 1, 4, 6, 9, 13 are in the edges,
    // the graph should have exactly 15 nodes (0 through 14).
    expect(graph.getNodes()).toHaveLength(15);

    const neighborsOf0 = graph.getNeighbors(0);
    expect(neighborsOf0).toHaveLength(3);
    expect(neighborsOf0[0].kind).toBe("unweighted");
    expect(neighborsOf0[0].to).toBe(6);
  });

  it("should correctly parse a weighted graph", async () => {
    const graph = await readGraphFromFile(weightedFilePath, true); // Treating as directed for test

    expect(graph.getNodes()).toHaveLength(1000);

    const neighborsOf0 = graph.getNeighbors(0);
    expect(neighborsOf0).toHaveLength(1);

    const edge = neighborsOf0[0];
    expect(edge.kind).toBe("weighted");

    if (edge.kind === "weighted") {
      expect(edge.weight).toBe(0.02075);
    }
  });
});
