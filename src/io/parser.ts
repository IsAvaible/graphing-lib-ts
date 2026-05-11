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
  cost: z.coerce.number().optional()
});

const MixedEdgeSchema = BaseEdgeSchema.extend({
  p3: z.coerce.number().optional(),
  p4: z.coerce.number().optional()
}).transform((val) => {
  // 4 columns: Flow Edge
  if (val.p4 !== undefined) {
    return {
      from: val.from,
      to: val.to,
      capacity: val.p3,
      cost: val.p4,
      flow: 0
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
  ["from", "to", "capacity", "cost"],
  "flow",
  { flow: 0 } // Automatically injected into every parsed edge
);

/**
 * Parses a graph containing a mix of Unweighted, Weighted, and Flow edges.
 */
export const parseMixedGraph = createGraphParser<Edge<number>>(
  MixedEdgeSchema,
  ["from", "to", "p3", "p4"],
  (parts) => {
    if (parts.length >= 4) return "flow";
    if (parts.length === 3) return "weighted";
    return "unweighted";
  }
);
