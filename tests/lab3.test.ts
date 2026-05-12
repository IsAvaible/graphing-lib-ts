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
      optimalWeightSum: 38.41
    },
    {
      name: "K_10e.txt",
      maxMs: 30,
      optimalWeightSum: 27.26
    },
    {
      name: "K_12.txt",
      maxMs: 2500,
      optimalWeightSum: 45.19
    },
    {
      name: "K_12e.txt",
      maxMs: 2500,
      optimalWeightSum: 36.13
    }
  ];

  function getWeightSum<T>(edges: WeightedEdge<T>[]) {
    return edges.reduce((sum, edge) => sum + edge.weight, 0);
  }

  describe.each(testCases)(
    "Testing performance & validity on $name",
    ({ name, maxMs, optimalWeightSum }) => {
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

      it(`Double Tree should find a valid approximate TSP tour weight sum for ${name}`, async () => {
        const graph = await parseWeightedGraph(
          readGraphFromFileNode(`./graphs/metric/${name}`)
        );

        const tourEdges = doubleTreeAlgorithm(graph);
        const weightSum = getWeightSum(tourEdges);

        // Double Tree is a 2-approximation algorithm
        const upperBound = optimalWeightSum * 2;

        console.log(
          `[Double Tree] ${name} Tour weight sum: ${weightSum.toFixed(2)} (Optimal: ${optimalWeightSum}, Max Allowed: ${upperBound.toFixed(2)})`
        );

        // The tour cannot be better than the optimal tour (allowing a tiny epsilon for JS floating-point math)
        expect(weightSum).toBeGreaterThanOrEqual(optimalWeightSum - 0.001);

        // The tour must respect the 2-approximation bound
        expect(weightSum).toBeLessThanOrEqual(upperBound + 0.001);
      });
    }
  );
});
