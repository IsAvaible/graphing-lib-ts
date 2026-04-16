import { Graph } from "../core/Graph";
import { parseGraphFromLines } from "./parser";

/**
 * Helper: Async generator to yield lines from a browser File or Blob.
 * Prevents loading massive files into RAM all at once.
 */
async function* makeLineIterator(file: File | Blob): AsyncGenerator<string> {
  const stream = file.stream();
  // Pipe the raw bytes through a TextDecoder to get strings
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let remainder = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Split the current chunk by newline (handles both \n and \r\n)
    const lines = (remainder + value).split(/\r?\n/);

    // The last element might be an incomplete line, save it for the next chunk
    remainder = lines.pop() || "";

    for (const line of lines) {
      yield line;
    }
  }

  // Yield any trailing text after the stream finishes
  if (remainder) {
    yield remainder;
  }
}

/**
 * Browser: Reads and parses a graph from a File object (e.g., from an <input type="file">).
 */
export async function readGraphFromFileBrowser(
  file: File | Blob,
  isDirected: boolean = false
): Promise<Graph<number>> {
  const lineIterator = makeLineIterator(file);
  return parseGraphFromLines(lineIterator, isDirected);
}
