import { describe, it, expect } from "vitest";
import { readGraphFromFileNode } from "../src/io/node-reader";
import { parseWeightedGraph } from "../src/io/parser";
import { dijkstra } from "../src/algorithms/sssp/dijkstra";
import { bellmanFord } from "../src/algorithms/sssp/bellmanFord";

describe("Lab 4 - Dijkstra and Bellman-Ford Shortest Path Tests", () => {
  describe("Wege1", () => {
    it("Dijkstra on Wege1 (directed): from node 2 to node 0 should have length 6", async () => {
      const graph = await parseWeightedGraph(
        readGraphFromFileNode("./graphs/ssp/Wege1.txt"),
        true
      );
      const { distances } = dijkstra(graph, 2);
      expect(distances.get(0)).toBe(6);
    });

    it("Bellman-Ford on Wege1 (directed): from node 2 to node 0 should have length 6", async () => {
      const graph = await parseWeightedGraph(
        readGraphFromFileNode("./graphs/ssp/Wege1.txt"),
        true
      );
      const { distances } = bellmanFord(graph, 2);
      expect(distances.get(0)).toBe(6);
    });
  });

  describe("Wege2", () => {
    it("Bellman-Ford on Wege2 (directed): from node 2 to node 0 should have length 2", async () => {
      const graph = await parseWeightedGraph(
        readGraphFromFileNode("./graphs/ssp/Wege2.txt"),
        true
      );
      const { distances } = bellmanFord(graph, 2);
      expect(distances.get(0)).toBe(2);
    });
  });

  describe("Wege3", () => {
    it("Bellman-Ford on Wege3 (directed) should throw an error due to a negative cycle", async () => {
      const graph = await parseWeightedGraph(
        readGraphFromFileNode("./graphs/ssp/Wege3.txt"),
        true
      );
      expect(() => {
        bellmanFord(graph, 2);
      }).toThrow("Negative weight cycle detected.");
    });
  });

  describe("G_1_2", () => {
    it("Dijkstra on G_1_2 (directed): from node 0 to node 1 should have length 5.56283", async () => {
      const graph = await parseWeightedGraph(
        readGraphFromFileNode("./graphs/weighted/G_1_2.txt"),
        true
      );
      const { distances } = dijkstra(graph, 0);
      expect(distances.get(1)).toBeCloseTo(5.56283, 5);
    });

    it("Bellman-Ford on G_1_2 (directed): from node 0 to node 1 should have length 5.56283", async () => {
      const graph = await parseWeightedGraph(
        readGraphFromFileNode("./graphs/weighted/G_1_2.txt"),
        true
      );
      const { distances } = bellmanFord(graph, 0);
      expect(distances.get(1)).toBeCloseTo(5.56283, 5);
    });

    it("Dijkstra on G_1_2 (undirected): from node 0 to node 1 should have length 2.36802", async () => {
      const graph = await parseWeightedGraph(
        readGraphFromFileNode("./graphs/weighted/G_1_2.txt"),
        false
      );
      const { distances } = dijkstra(graph, 0);
      expect(distances.get(1)).toBeCloseTo(2.36802, 5);
    });

    it("Bellman-Ford on G_1_2 (undirected): from node 0 to node 1 should have length 2.36802", async () => {
      const graph = await parseWeightedGraph(
        readGraphFromFileNode("./graphs/weighted/G_1_2.txt"),
        false
      );
      const { distances } = bellmanFord(graph, 0);
      expect(distances.get(1)).toBeCloseTo(2.36802, 5);
    });
  });
});
