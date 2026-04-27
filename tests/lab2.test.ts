import { describe, it, expect } from "vitest";
import { readGraphFromFileNode } from "../src/io/node-reader";
import { primsAlgorithm, kruskalsAlgorithm } from "../src/algorithms/mst";

describe("Lab Assignment - MST Algorithms Runtime Tests", () => {
  // Runtime Limit = Reference time in seconds * 10 (allowed overhead) * 1000 (convert to ms)
  const testCases = [
    { name: "G_1_2.txt", kruskalMaxMs: 30, primMaxMs: 20 },
    { name: "G_1_20.txt", kruskalMaxMs: 100, primMaxMs: 40 },
    { name: "G_1_200.txt", kruskalMaxMs: 1200, primMaxMs: 220 },
    { name: "G_10_20.txt", kruskalMaxMs: 200, primMaxMs: 80 },
    { name: "G_10_200.txt", kruskalMaxMs: 1100, primMaxMs: 230 },
    { name: "G_100_200.txt", kruskalMaxMs: 2400, primMaxMs: 810 }
  ];

  describe.each(testCases)(
    "Testing performance on $name",
    ({ name, kruskalMaxMs, primMaxMs }) => {
      it(`Kruskal should process ${name} within ${kruskalMaxMs}ms`, async () => {
        const graph = await readGraphFromFileNode(`./graphs/weighted/${name}`);

        const start = performance.now();
        kruskalsAlgorithm(graph);
        const end = performance.now();

        const runtimeMs = end - start;
        console.log(
          `[Kruskal] ${name} executed in ${runtimeMs.toFixed(2)}ms (Limit: ${kruskalMaxMs}ms)`
        );
        expect(runtimeMs).toBeLessThanOrEqual(kruskalMaxMs);
      });

      it(`Prim should process ${name} within ${primMaxMs}ms`, async () => {
        const graph = await readGraphFromFileNode(`./graphs/weighted/${name}`);

        const start = performance.now();
        primsAlgorithm(graph);
        const end = performance.now();

        const runtimeMs = end - start;
        console.log(
          `[Prim] ${name} executed in ${runtimeMs.toFixed(2)}ms (Limit: ${primMaxMs}ms)`
        );
        expect(runtimeMs).toBeLessThanOrEqual(primMaxMs);
      });
    }
  );
});
