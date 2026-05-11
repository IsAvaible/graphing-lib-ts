import { describe, it, expect } from "vitest";
import { readGraphFromFileNode } from "../src/io/node-reader";
import { type WeightedEdge } from "../src/core/types";
import { doubleTreeAlgorithm } from "../src/algorithms/tsp/doubleTreeTsp";
import { parseWeightedGraph } from "../src/io/parser";

describe("Lab Assignment - Double Tree TSP Algorithm Runtime Tests", () => {
  // Runtime Limit = Reference time in seconds * 10 (allowed overhead) * 1000 (convert to ms)
  const testCases = [
    {
      name: "K_10.txt",
      maxMs: 30,
      expectedWeightSum: 38.41
    },
    {
      name: "K_10e.txt",
      maxMs: 30,
      expectedWeightSum: 27.26
    },
    {
      name: "K_12.txt",
      maxMs: 2500,
      expectedWeightSum: 45.19
    },
    {
      name: "K_12e.txt",
      maxMs: 2500,
      expectedWeightSum: 36.13
    }
  ];

  function getWeightSum<T>(edges: WeightedEdge<T>[]) {
    return edges.reduce((sum, edge) => sum + edge.weight, 0);
  }

  describe.each(testCases)(
    "Testing performance & validity on $name",
    ({ name, maxMs, expectedWeightSum }) => {
      it(`Double Tree should process ${name} within ${maxMs}ms`, async () => {
        // Adjust the directory path if your complete graphs are stored elsewhere
        const graph = await parseWeightedGraph(
          readGraphFromFileNode(`./graphs/metric/${name}`)
        );

        const start = performance.now();
        doubleTreeAlgorithm(graph);
        const end = performance.now();

        const runtimeMs = end - start;
        console.log(
          `[Double Tree] ${name} executed in ${runtimeMs.toFixed(2)}ms (Limit: ${maxMs}ms)`
        );

        expect(runtimeMs).toBeLessThanOrEqual(maxMs);
      });

      it(`Double Tree should find the correct TSP tour weight sum for ${name}`, async () => {
        const graph = await parseWeightedGraph(
          readGraphFromFileNode(`./graphs/metric/${name}`)
        );

        const tourEdges = doubleTreeAlgorithm(graph);
        const weightSum = getWeightSum(tourEdges);

        console.log(
          `[Double Tree] ${name} Tour weight sum: ${weightSum.toFixed(2)} (Expected: ${expectedWeightSum})`
        );

        // Using 2 decimal places precision for the TSP weights
        expect(weightSum).toBeCloseTo(expectedWeightSum, 2);
      });
    }
  );
});
