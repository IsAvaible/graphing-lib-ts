import * as fs from "fs";
import * as readline from "readline";
import { Graph } from "../core/Graph";
import { parseGraphFromLines } from "./parser";

/**
 * Node.js: Reads and parses a graph text file asynchronously.
 */
export async function readGraphFromFileNode(
  filePath: string,
  isDirected: boolean = false
): Promise<Graph<number>> {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  // Pass the readline interface directly to the agnostic parser
  return parseGraphFromLines(rl, isDirected);
}
