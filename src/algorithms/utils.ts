import { Graph } from "../core/Graph.ts";
import type { FlowEdge } from "../core/types.ts";

export const EPSILON = 1e-6;

/**
 * Runs a generator to completion and returns its final return value.
 * @throws {Error} If the generator is not exhausted after the first call to next().
 */
export function runGenerator<TState, TReturn>(
  generator: Generator<TState, TReturn, unknown>
): TReturn {
  const result = generator.next();

  if (!result.done) {
    throw new Error(
      "Generator should have been exhausted since recordState is false."
    );
  }

  return result.value;
}

/**
 * Identifies the source and sink nodes of a flow network.
 * If useCapacity is true, it identifies nodes topologically (in-degree = 0 for source, out-degree = 0 for sink).
 * If useCapacity is false, it uses flow conservation (net flow > 0 for source, net flow < 0 for sink).
 */
export function resolveSourceAndSink<T extends string | number>(
  graph: Graph<T, boolean, FlowEdge<T>>,
  useCapacity: boolean = false,
  epsilon = EPSILON
): { s: T | null; t: T | null } {
  // Unified state tracking for both degree counts and flow sums
  const stats = new Map<T, { in: number; out: number }>();

  const getStats = (node: T) => {
    if (!stats.has(node)) stats.set(node, { in: 0, out: 0 });
    return stats.get(node)!;
  };

  // Single pass to populate metrics
  for (const node of graph.getNodes()) {
    for (const edge of graph.getNeighbors(node)) {
      if (edge.kind !== "flow") continue;

      // If useCapacity: we count the edge (weight = 1)
      // If !useCapacity: we accumulate the flow (weight = edge.flow)
      const weight = useCapacity ? (edge.capacity > 0 ? 1 : 0) : edge.flow;

      if (weight > 0) {
        getStats(edge.from).out += weight;
        getStats(edge.to).in += weight;
      }
    }
  }

  let s: T | null = null;
  let t: T | null = null;
  let maxOutgoing = 0;
  let maxIncoming = 0;

  // Single pass to evaluate Source and Sink
  for (const [node, { in: inVal, out: outVal }] of stats.entries()) {
    if (useCapacity) {
      if (inVal === 0 && outVal > 0) s = node;
      if (outVal === 0 && inVal > 0) t = node;
    } else {
      const net = outVal - inVal; // Net positive = source, Net negative = sink

      if (net > maxOutgoing) {
        maxOutgoing = net;
        s = node;
      } else if (-net > maxIncoming) {
        maxIncoming = -net;
        t = node;
      }
    }
  }

  // Apply epsilon check only for the flow conservation approach
  if (!useCapacity) {
    if (maxOutgoing < epsilon) s = null;
    if (maxIncoming < epsilon) t = null;
  }

  return { s, t };
}
