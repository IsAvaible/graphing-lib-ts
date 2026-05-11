import * as fs from "fs";
import * as readline from "readline";

/**
 * Node.js: Reads and parses a graph text file asynchronously.
 */
export function readGraphFromFileNode(filePath: string): AsyncIterable<string> {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  return rl;
}
