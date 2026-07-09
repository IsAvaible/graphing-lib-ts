import { z } from "zod";
import { Graph } from "../core/Graph";
import type {
  Edge,
  UnweightedEdge,
  WeightedEdge,
  FlowEdge
} from "../core/types";

const BaseEdgeSchema = z.object({
  from: z.coerce.number().int(),
  to: z.coerce.number().int()
});

const WeightedEdgeSchema = BaseEdgeSchema.extend({
  weight: z.coerce.number()
});

const FlowEdgeSchema = BaseEdgeSchema.extend({
  capacity: z.coerce.number(),
  flow: z.coerce.number().default(0),
  cost: z.coerce.number().optional()
});

const MixedEdgeSchema = BaseEdgeSchema.extend({
  p3: z.coerce.number().optional(),
  p4: z.coerce.number().optional(),
  p5: z.coerce.number().optional()
}).transform((val) => {
  // 5 columns: Flow Edge with capacity, flow, cost
  if (val.p5 !== undefined) {
    return {
      from: val.from,
      to: val.to,
      capacity: val.p3,
      flow: val.p4,
      cost: val.p5
    };
  }
  // 4 columns: Flow Edge with capacity, flow
  if (val.p4 !== undefined) {
    return {
      from: val.from,
      to: val.to,
      capacity: val.p3,
      flow: val.p4
    };
  }
  // 3 columns: Weighted Edge
  if (val.p3 !== undefined) {
    return {
      from: val.from,
      to: val.to,
      weight: val.p3
    };
  }
  // 2 columns: Unweighted Edge
  return {
    from: val.from,
    to: val.to
  };
});

/**
 * Higher-order function that generates typed graph parsers.
 *
 * @param schema The Zod schema to validate the extracted fields.
 * @param keys Maps the split string array indices to object keys (e.g. ["from", "to", "weight"]).
 * @param kindResolver The literal "kind" string, or a function to determine it dynamically.
 * @param defaultProps Any properties to inject automatically (e.g. { flow: 0 }).
 */
function createGraphParser<TEdge extends Edge<number>>(
  schema: z.ZodType<any>,
  keys: (keyof TEdge | string)[],
  kindResolver: TEdge["kind"] | ((parts: string[]) => TEdge["kind"]),
  defaultProps: Partial<TEdge> = {}
) {
  return async <IsDirected extends boolean = false>(
    lines: AsyncIterable<string> | Iterable<string>,
    isDirected: IsDirected = false as IsDirected
  ): Promise<Graph<number, IsDirected, TEdge>> => {
    const graph = new Graph<number, IsDirected, TEdge>(isDirected);
    let isFirstLine = true;

    for await (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (isFirstLine) {
        const numVertices = z.coerce.number().int().parse(trimmed);
        for (let i = 0; i < numVertices; i++) graph.addNode(i);
        isFirstLine = false;
        continue;
      }

      const parts = trimmed.split(/\s+/);

      // Dynamically map the array indices to object keys based on the provided keys array
      const rawInput: Record<string, any> = {};
      keys.forEach((key, index) => {
        if (parts[index] !== undefined) rawInput[key as string] = parts[index];
      });

      // Validate using Zod
      const parsed = schema.parse(rawInput);

      // Resolve the discriminated union kind
      const kind =
        typeof kindResolver === "function" ? kindResolver(parts) : kindResolver;

      // Construct and add the edge
      graph.addEdge({ kind, ...defaultProps, ...parsed });
    }

    return graph;
  };
}

// --- Dedicated Public APIs (1-liners) ---

export const parseUnweightedGraph = createGraphParser<UnweightedEdge<number>>(
  BaseEdgeSchema,
  ["from", "to"],
  "unweighted"
);

export const parseWeightedGraph = createGraphParser<WeightedEdge<number>>(
  WeightedEdgeSchema,
  ["from", "to", "weight"],
  "weighted"
);

export const parseFlowGraph = createGraphParser<FlowEdge<number>>(
  FlowEdgeSchema,
  ["from", "to", "capacity", "flow", "cost"],
  "flow"
);

/**
 * Parses a Min-Cost Flow (MCF) graph containing node balances and flow edges (format: from to cost capacity).
 */
export const parseMinCostFlowGraph = async <IsDirected extends boolean = false>(
  linesIterable: AsyncIterable<string> | Iterable<string>,
  isDirected: IsDirected = false as IsDirected
): Promise<Graph<number, IsDirected, FlowEdge<number>>> => {
  const graph = new Graph<number, IsDirected, FlowEdge<number>>(isDirected);
  const balances = new Map<number, number>();

  let numVertices = -1;
  let balanceCount = 0;

  for await (const line of linesIterable) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (numVertices === -1) {
      numVertices = parseInt(trimmed, 10);
      if (isNaN(numVertices)) {
        throw new Error("Invalid vertex count in first line");
      }
      // Initialize nodes
      for (let i = 0; i < numVertices; i++) {
        graph.addNode(i);
      }
      continue;
    }

    if (balanceCount < numVertices) {
      const balance = parseFloat(trimmed);
      if (isNaN(balance)) {
        throw new Error(
          `Invalid balance at node index ${balanceCount}: ${trimmed}`
        );
      }
      balances.set(balanceCount, balance);
      balanceCount++;
    } else {
      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) continue;

      const from = parseInt(parts[0], 10);
      const to = parseInt(parts[1], 10);
      if (isNaN(from) || isNaN(to)) {
        throw new Error(`Invalid edge vertices: ${trimmed}`);
      }

      const cost = parts[2] !== undefined ? parseFloat(parts[2]) : 0;
      const capacity = parts[3] !== undefined ? parseFloat(parts[3]) : 0;

      graph.addEdge({
        kind: "flow",
        from,
        to,
        capacity,
        flow: 0,
        cost
      });
    }
  }

  if (numVertices === -1) {
    throw new Error("Empty graph file");
  }

  graph.balances = balances;
  return graph;
};

/**
 * Parses a graph containing a mix of Unweighted, Weighted, and Flow edges.
 */
export const parseMixedGraph = async <IsDirected extends boolean = false>(
  linesIterable: AsyncIterable<string> | Iterable<string>,
  isDirected: IsDirected = false as IsDirected
): Promise<Graph<number, IsDirected, Edge<number>>> => {
  // Normalize to an async iterator so we can manually peek at the first few lines
  async function* getIterator() {
    yield* linesIterable;
  }
  const iterator = getIterator();

  const peekedLines: string[] = [];
  let isMCF = false;
  let validLinesCount = 0;

  while (true) {
    const { done, value: line } = await iterator.next();
    if (done) break;

    peekedLines.push(line);
    const trimmed = line.trim();

    if (!trimmed) continue;
    validLinesCount++;

    if (validLinesCount === 1) {
      const numVertices = parseInt(trimmed, 10);
      if (isNaN(numVertices)) {
        throw new Error("Invalid vertex count in first line");
      }
    } else if (validLinesCount === 2) {
      // Detect if it is MCF graph:
      // If the second line has only 1 token, then it represents a node balance (MCF)
      const secondLineParts = trimmed.split(/\s+/);
      if (secondLineParts.length === 1) {
        isMCF = true;
      }
      break;
    }
  }

  if (validLinesCount === 0) {
    throw new Error("Empty graph file");
  }

  // Combine the peeked lines back with the rest of the stream
  const combinedIterable = (async function* () {
    yield* peekedLines;
    yield* iterator;
  })();

  if (isMCF) {
    return (await parseMinCostFlowGraph(
      combinedIterable,
      isDirected
    )) as unknown as Graph<number, IsDirected, Edge<number>>;
  }

  // Fallback to the original parseMixedGraph behavior
  const originalParser = createGraphParser<Edge<number>>(
    MixedEdgeSchema,
    ["from", "to", "p3", "p4", "p5"],
    (parts) => {
      if (parts.length >= 4) return "flow";
      if (parts.length === 3) return "weighted";
      return "unweighted";
    }
  );

  return originalParser(combinedIterable, isDirected);
};
