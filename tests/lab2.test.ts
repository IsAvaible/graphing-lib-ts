import { describe, it, expect } from "vitest";
import { readGraphFromFileNode } from "../src/io/node-reader";
import { primsAlgorithm, kruskalsAlgorithm } from "../src/algorithms/mst";
import { type WeightedEdge } from "../src/core/types";
import { parseWeightedGraph } from "../src/io/parser";

describe("Lab Assignment - MST Algorithms Runtime Tests", () => {
  // Runtime Limit = Reference time in seconds * 10 (allowed overhead) * 1000 (convert to ms)
  const testCases = [
    {
      name: "G_1_2.txt",
      kruskalMaxMs: 30,
      primMaxMs: 20,
      weightSum: 287.32286
    },
    {
      name: "G_1_20.txt",
      kruskalMaxMs: 100,
      primMaxMs: 40,
      weightSum: 36.86275
    },
    {
      name: "G_1_200.txt",
      kruskalMaxMs: 1200,
      primMaxMs: 220,
      weightSum: 12.68182
    },
    {
      name: "G_10_20.txt",
      kruskalMaxMs: 200,
      primMaxMs: 80,
      weightSum: 2785.62417
    },
    {
      name: "G_10_200.txt",
      kruskalMaxMs: 1100,
      primMaxMs: 230,
      weightSum: 372.14417
    },
    {
      name: "G_100_200.txt",
      kruskalMaxMs: 2400,
      primMaxMs: 810,
      weightSum: 27550.51488
    }
  ];

  function getWeightSum<T>(edges: WeightedEdge<T>[]) {
    return edges.reduce((a, b) => a + b.weight, 0);
  }

  describe.each(testCases)(
    "Testing performance & validity on $name",
    ({ name, kruskalMaxMs, primMaxMs, weightSum: expectedWeightSum }) => {
      it(`Kruskal should process ${name} within ${kruskalMaxMs}ms`, async () => {
        const graph = await parseWeightedGraph(
          readGraphFromFileNode(`./graphs/weighted/${name}`)
        );

        const start = performance.now();
        kruskalsAlgorithm(graph);
        const end = performance.now();

        const runtimeMs = end - start;
        console.log(
          `[Kruskal] ${name} executed in ${runtimeMs.toFixed(2)}ms (Limit: ${kruskalMaxMs}ms)`
        );
        expect(runtimeMs).toBeLessThanOrEqual(kruskalMaxMs);
      });

      it(`Kruskal should find the correct MST weight sum for ${name}`, async () => {
        const graph = await parseWeightedGraph(
          readGraphFromFileNode(`./graphs/weighted/${name}`)
        );

        const mstEdges = kruskalsAlgorithm(graph);
        const weightSum = getWeightSum(mstEdges);

        console.log(
          `[Kruskal] ${name} MST weight sum: ${weightSum.toFixed(5)} (Expected: ${expectedWeightSum})`
        );
        expect(weightSum).toBeCloseTo(expectedWeightSum, 5);
      });

      it(`Prim should process ${name} within ${primMaxMs}ms`, async () => {
        const graph = await parseWeightedGraph(
          readGraphFromFileNode(`./graphs/weighted/${name}`)
        );

        const start = performance.now();
        primsAlgorithm(graph);
        const end = performance.now();

        const runtimeMs = end - start;
        console.log(
          `[Prim] ${name} executed in ${runtimeMs.toFixed(2)}ms (Limit: ${primMaxMs}ms)`
        );
        expect(runtimeMs).toBeLessThanOrEqual(primMaxMs);
      });

      it(`Prim should find the correct MST weight sum for ${name}`, async () => {
        const graph = await parseWeightedGraph(
          readGraphFromFileNode(`./graphs/weighted/${name}`)
        );

        const mstEdges = primsAlgorithm(graph);
        const weightSum = getWeightSum(mstEdges);

        console.log(
          `[Prim] ${name} MST weight sum: ${weightSum.toFixed(5)} (Expected: ${expectedWeightSum})`
        );
        expect(weightSum).toBeCloseTo(expectedWeightSum, 5);
      });
    }
  );
});
