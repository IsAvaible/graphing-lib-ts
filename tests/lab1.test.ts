import { describe, it, expect } from "vitest";
import { readGraphFromFileNode } from "../src/io/node-reader";
import { countConnectedComponents } from "../src/algorithms/search";

describe("Lab Assignment 1 - Test Suite", () => {
  it("should compute 2 connected components for Graph1", async () => {
    const graph1 = await readGraphFromFileNode("./graphs/simple/Graph1.txt");

    const result = countConnectedComponents(graph1);

    expect(result).toBe(2);
  });

  it("should compute 4 connected components for Graph2", async () => {
    const graph2 = await readGraphFromFileNode("./graphs/simple/Graph2.txt");

    const result = countConnectedComponents(graph2);

    expect(result).toBe(4);
  });

  it("should compute 4 connected components for Graph2", async () => {
    const graph3 = await readGraphFromFileNode("./graphs/simple/Graph3.txt");

    const result = countConnectedComponents(graph3);

    expect(result).toBe(4);
  });

  it("should compute 222 connected components for Graph_gross", async () => {
    const graphGross = await readGraphFromFileNode(
      "./graphs/simple/Graph_gross.txt"
    );

    const result = countConnectedComponents(graphGross);

    expect(result).toBe(222);
  });

  it("should compute 9560 connected components for Graph_ganzgross", async () => {
    const graphGanzgross = await readGraphFromFileNode(
      "./graphs/simple/Graph_ganzgross.txt"
    );

    const result = countConnectedComponents(graphGanzgross);

    expect(result).toBe(9560);
  });

  it("should compute 306 connected components for Graph_ganzganzgross", async () => {
    const graphGanzganzgross = await readGraphFromFileNode(
      "./graphs/simple/Graph_ganzganzgross.txt"
    );

    const result = countConnectedComponents(graphGanzganzgross);

    expect(result).toBe(306);
  }, 10_000); // 10sec timeout
});
