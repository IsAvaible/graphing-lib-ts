import { Graph } from "@/core/Graph.ts";
import type { WeightedEdge } from "@/core/types.ts";
import { runGenerator } from "../utils";
import type { LocalizedNote } from "@/lib/localization.ts";

/**
 * Represents a snapshot of the Moore-Bellman-Ford algorithm at a specific step.
 * @template T The id-type of a vertex in the graph. Constrained to primitives for Map/Set safety.
 */
export interface BellmanFordState<T extends string | number> {
  currentNode: T | null; // Node we are currently relaxing from
  distances: Map<T, number>; // Distance from start node to other nodes
  predecessors: Map<T, T | null>; // Shortest path tree structure
  evaluatingEdge: WeightedEdge<T> | null; // Edge currently being evaluated/relaxed
  iteration: number; // Current iteration index (1 to V)
  notes?: LocalizedNote;
}

/**
 * Represents the final result of the Moore-Bellman-Ford algorithm.
 */
export interface BellmanFordResult<T> {
  distances: Map<T, number>;
  predecessors: Map<T, T | null>;
}

/**
 * A Generator that yields the state of Moore-Bellman-Ford's algorithm at each step.
 */
export function* bellmanFordGenerator<T extends string | number>(
  graph: Graph<T, boolean, WeightedEdge<T>>,
  startNode?: T,
  recordState: boolean = true
): Generator<BellmanFordState<T>, BellmanFordResult<T>, unknown> {
  const nodes = graph.getNodes();
  const V = nodes.length;

  if (V === 0) {
    return { distances: new Map(), predecessors: new Map() };
  }

  let actualStartNode: T;
  if (startNode !== undefined) {
    if (!graph.hasNode(startNode)) {
      throw new Error(`Start node '${startNode}' does not exist in the graph.`);
    }
    actualStartNode = startNode;
  } else {
    actualStartNode = nodes[0];
  }

  const distances = new Map<T, number>();
  const predecessors = new Map<T, T | null>();

  for (const node of nodes) {
    distances.set(node, Infinity);
    predecessors.set(node, null);
  }

  distances.set(actualStartNode, 0);

  const getState = (
    currentNode: T | null,
    evaluatingEdge: WeightedEdge<T> | null,
    iteration: number,
    notes?: LocalizedNote
  ): BellmanFordState<T> => ({
    currentNode,
    distances: new Map(distances),
    predecessors: new Map(predecessors),
    evaluatingEdge,
    iteration,
    notes
  });

  // Yield initial state
  if (recordState) {
    yield getState(null, null, 0, {
      key: "bellman_ford.init",
      params: { startNode: actualStartNode }
    });
  }

  // Relax edges |V| - 1 times
  for (let i = 1; i < V; i++) {
    let anyRelaxation = false;

    for (const u of nodes) {
      const distU = distances.get(u) ?? Infinity;

      // Relax all outgoing edges of node u
      for (const edge of graph.getNeighbors(u)) {
        if (edge.kind !== "weighted") continue;

        // Skip evaluating if the source node distance is Infinity
        if (distU === Infinity) continue;

        // Yield that we are evaluating this edge
        if (recordState) {
          yield getState(u, edge, i, {
            key: "bellman_ford.evaluate_edge",
            params: {
              iteration: i,
              from: edge.from,
              to: edge.to,
              weight: edge.weight
            }
          });
        }

        const alt = distU + edge.weight;
        const distV = distances.get(edge.to) ?? Infinity;

        if (alt < distV) {
          distances.set(edge.to, alt);
          predecessors.set(edge.to, u);
          anyRelaxation = true;

          // Yield to show the relaxation and updated predecessor
          if (recordState) {
            yield getState(u, edge, i, {
              key: "bellman_ford.relax_edge",
              params: {
                iteration: i,
                from: edge.from,
                to: edge.to,
                newDist: alt
              }
            });
          }
        }
      }
    }

    // Optimization: If no edge was relaxed in this iteration, we can stop early.
    if (!anyRelaxation) {
      break;
    }
  }

  // V-th iteration: Check for negative-weight cycles
  for (const u of nodes) {
    const distU = distances.get(u) ?? Infinity;
    if (distU === Infinity) continue;

    for (const edge of graph.getNeighbors(u)) {
      if (edge.kind !== "weighted") continue;

      // Yield that we are evaluating this edge for negative cycles
      if (recordState) {
        yield getState(u, edge, V, {
          key: "bellman_ford.check_negative_cycle",
          params: { from: edge.from, to: edge.to, weight: edge.weight }
        });
      }

      const alt = distU + edge.weight;
      const distV = distances.get(edge.to) ?? Infinity;

      if (alt < distV) {
        // Yield the state showing where the negative cycle detection failed
        if (recordState) {
          yield getState(u, edge, V, {
            key: "bellman_ford.check_negative_cycle",
            params: { from: edge.from, to: edge.to, weight: edge.weight }
          });
        }
        // TODO: Convert this to an output instead of an error
        throw new Error("Negative weight cycle detected.");
      }
    }
  }

  // Clear current node and evaluating edge at completion
  if (recordState) {
    yield getState(null, null, V, {
      key: "bellman_ford.complete"
    });
  }

  return { distances, predecessors };
}

/**
 * Standard utility wrapper to run Moore-Bellman-Ford's algorithm instantly.
 */
export function bellmanFord<T extends string | number>(
  graph: Graph<T, boolean, WeightedEdge<T>>,
  startNode?: T
): BellmanFordResult<T> {
  return runGenerator(bellmanFordGenerator(graph, startNode, false));
}
