import { describe, it, expect } from "vitest";
import * as path from "path";
import { fileURLToPath } from "url";
import { cycleCanceling } from "../src/algorithms/cycleCanceling";
import { successiveShortestPath } from "../src/algorithms/successiveShortestPath";
import { parseMinCostFlowGraph } from "../src/io/parser";
import { readGraphFromFileNode } from "../src/io/node-reader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getMCFPath(filename: string): string {
  return path.join(__dirname, "../graphs/mcf", filename);
}

describe("Lab 6 - Cycle-Canceling and Successive Shortest Path MCF", () => {
  describe("Direct Execution on MCF Test Graphs", () => {
    it("should compute the correct min cost for Kostenminimal1.txt (3)", async () => {
      const graphPath = getMCFPath("Kostenminimal1.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      const minCost = cycleCanceling(graph);
      expect(minCost).toBe(3);
    });

    it("should compute the correct min cost for Kostenminimal2.txt (0)", async () => {
      const graphPath = getMCFPath("Kostenminimal2.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      const minCost = cycleCanceling(graph);
      expect(minCost).toBe(0);
    });

    it("should throw error 'kein b-Fluss möglich' for Kostenminimal3.txt", async () => {
      const graphPath = getMCFPath("Kostenminimal3.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      expect(() => cycleCanceling(graph)).toThrow(
        "No b-flow possible: Sum of the balances is not equal to 0"
      );
    });

    it("should throw error 'kein b-Fluss möglich' for Kostenminimal4.txt", async () => {
      const graphPath = getMCFPath("Kostenminimal4.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      expect(() => cycleCanceling(graph)).toThrow("kein b-Fluss möglich");
    });

    it("should compute the correct min cost for Kostenminimal_gross1.txt (1537)", async () => {
      const graphPath = getMCFPath("Kostenminimal_gross1.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      const minCost = cycleCanceling(graph);
      expect(minCost).toBe(1537);
    });

    it("should compute the correct min cost for Kostenminimal_gross2.txt (1838)", async () => {
      const graphPath = getMCFPath("Kostenminimal_gross2.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      const minCost = cycleCanceling(graph);
      expect(minCost).toBe(1838);
    });

    it("should throw error 'kein b-Fluss möglich' for Kostenminimal_gross3.txt", async () => {
      const graphPath = getMCFPath("Kostenminimal_gross3.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      expect(() => cycleCanceling(graph)).toThrow("kein b-Fluss möglich");
    });
  });

  describe("Direct Execution on MCF Test Graphs - Successive Shortest Path", () => {
    it("should compute the correct min cost for Kostenminimal1.txt (3)", async () => {
      const graphPath = getMCFPath("Kostenminimal1.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      const minCost = successiveShortestPath(graph);
      expect(minCost).toBe(3);
    });

    it("should compute the correct min cost for Kostenminimal2.txt (0)", async () => {
      const graphPath = getMCFPath("Kostenminimal2.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      const minCost = successiveShortestPath(graph);
      expect(minCost).toBe(0);
    });

    it("should throw error 'kein b-Fluss möglich' for Kostenminimal3.txt", async () => {
      const graphPath = getMCFPath("Kostenminimal3.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      expect(() => successiveShortestPath(graph)).toThrow(
        "No b-flow possible: Sum of the balances is not equal to 0"
      );
    });

    it("should throw error 'kein b-Fluss möglich' for Kostenminimal4.txt", async () => {
      const graphPath = getMCFPath("Kostenminimal4.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      expect(() => successiveShortestPath(graph)).toThrow(
        "kein b-Fluss möglich"
      );
    });

    it("should compute the correct min cost for Kostenminimal_gross1.txt (1537)", async () => {
      const graphPath = getMCFPath("Kostenminimal_gross1.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      const minCost = successiveShortestPath(graph);
      expect(minCost).toBe(1537);
    });

    it("should compute the correct min cost for Kostenminimal_gross2.txt (1838)", async () => {
      const graphPath = getMCFPath("Kostenminimal_gross2.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      const minCost = successiveShortestPath(graph);
      expect(minCost).toBe(1838);
    });

    it("should throw error 'kein b-Fluss möglich' for Kostenminimal_gross3.txt", async () => {
      const graphPath = getMCFPath("Kostenminimal_gross3.txt");
      const graph = await parseMinCostFlowGraph(
        readGraphFromFileNode(graphPath),
        true
      );

      expect(() => successiveShortestPath(graph)).toThrow(
        "kein b-Fluss möglich"
      );
    });
  });
});
