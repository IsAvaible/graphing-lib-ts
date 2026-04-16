import * as fs from "fs";
import * as readline from "readline";
import { z } from "zod";
import { Graph } from "../core/Graph";
import type { UnweightedEdge, WeightedEdge } from "../core/types";

// Zod schema for edge validation
const EdgeSchema = z.object({
  start: z.coerce.number().int(),
  end: z.coerce.number().int(),
  weight: z.coerce.number().optional()
});

/**
 * Parses a graph text file asynchronously.
 * Line 1: Number of vertices (N).
 * Subsequent lines: [from] [to] OR [from] [to] [weight]
 */
export async function readGraphFromFile(
  filePath: string,
  isDirected: boolean = false
): Promise<Graph<number>> {
  const fileStream = fs.createReadStream(filePath);

  // readline is memory efficient, even for files with millions of lines
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const graph = new Graph<number>(isDirected);
  let isFirstLine = true;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue; // Skip empty lines

    // Capture vertices count
    if (isFirstLine) {
      const numVertices = z.coerce.number().int().parse(trimmed);

      // Pre-populate all nodes (0 to numVertices - 1) to ensure isolated nodes are included
      for (let i = 0; i < numVertices; i++) {
        graph.addNode(i);
      }

      isFirstLine = false;
      continue;
    }

    // Parse edge definitions
    const parts = trimmed.split(/\s+/);

    // Map the raw string array to our pre-defined names
    const rawEdge = {
      start: parts[0],
      end: parts[1],
      ...(parts[2] !== undefined && { weight: parts[2] })
    };

    // Transform and validate using Zod
    const parsedEdge = EdgeSchema.parse(rawEdge);

    if (parsedEdge.weight === undefined) {
      // 2 columns: It's an Unweighted Graph
      const edge: UnweightedEdge<number> = {
        kind: "unweighted",
        to: parsedEdge.end
      };
      graph.addEdge(parsedEdge.start, edge);
    } else {
      // 3 columns: It's a Weighted Graph
      const edge: WeightedEdge<number> = {
        kind: "weighted",
        to: parsedEdge.end,
        weight: parsedEdge.weight
      };
      graph.addEdge(parsedEdge.start, edge);
    }
  }

  return graph;
}
