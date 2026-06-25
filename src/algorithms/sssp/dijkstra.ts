import { Graph } from "@/core/Graph.ts";
import type { WeightedEdge } from "@/core/types.ts";
import { PriorityQueue } from "@/algorithms/datastructures/PriorityQueue.ts";
import { runGenerator } from "../utils";
import type { LocalizedNote } from "@/lib/localization.ts";

/**
 * Represents a snapshot of Dijkstra's algorithm at a specific step.
 * @template T The id-type of a vertex in the graph. Constrained to primitives for Map/Set safety.
 */
export interface DijkstraState<T extends string | number> {
  currentNode: T | null;
  visitedNodes: Set<T>; // Settled nodes (shortest path finalized)
  distances: Map<T, number>; // Distance from start node to other nodes
  predecessors: Map<T, T | null>; // Shortest path tree structure
  queue: { node: T; distance: number }[]; // Nodes currently in the priority queue
  evaluatingEdge: WeightedEdge<T> | null; // Edge currently being relaxed
  notes?: LocalizedNote;
}

/**
 * Represents the final result of Dijkstra's algorithm.
 */
export interface DijkstraResult<T> {
  distances: Map<T, number>;
  predecessors: Map<T, T | null>;
}

/**
 * A Generator that yields the state of Dijkstra's algorithm at each step.
 */
export function* dijkstraGenerator<T extends string | number>(
  graph: Graph<T, boolean, WeightedEdge<T>>,
  startNode?: T,
  recordState: boolean = true
): Generator<DijkstraState<T>, DijkstraResult<T>, unknown> {
  const nodes = graph.getNodes();
  if (nodes.length === 0) {
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
  const visitedNodes = new Set<T>();

  // Distance based priority queue
  const pq = new PriorityQueue<{ node: T; distance: number }>(
    (a, b) => a.distance - b.distance
  );

  for (const node of nodes) {
    distances.set(node, Infinity);
    predecessors.set(node, null);
  }

  distances.set(actualStartNode, 0);
  pq.push({ node: actualStartNode, distance: 0 });

  const getState = (
    currentNode: T | null,
    evaluatingEdge: WeightedEdge<T> | null,
    notes?: LocalizedNote
  ): DijkstraState<T> => ({
    currentNode,
    visitedNodes: new Set(visitedNodes),
    distances: new Map(distances),
    predecessors: new Map(predecessors),
    queue: pq.toArray(),
    evaluatingEdge,
    notes
  });

  if (recordState) {
    yield getState(null, null, {
      key: "dijkstra.start",
      params: { startNode: actualStartNode }
    });
  }

  while (!pq.isEmpty()) {
    const { node: u, distance: distU } = pq.pop()!;

    // Skip duplicates
    if (visitedNodes.has(u)) continue;

    visitedNodes.add(u);

    // Yield when we pop a node to evaluate
    if (recordState) {
      yield getState(u, null, {
        key: "dijkstra.pop_node",
        params: { u, dist: distU }
      });
    }

    // Relax all outgoing edges of node u
    for (const edge of graph.getNeighbors(u)) {
      if (edge.kind !== "weighted") continue;

      // Yield that we are evaluating this edge
      if (recordState) {
        yield getState(u, edge, {
          key: "dijkstra.evaluate_edge",
          params: { from: edge.from, to: edge.to, weight: edge.weight }
        });
      }

      const alt = distU + edge.weight;
      const distV = distances.get(edge.to) ?? Infinity;

      if (alt < distV) {
        distances.set(edge.to, alt);
        predecessors.set(edge.to, u);
        pq.push({ node: edge.to, distance: alt });

        // Yield to show the relaxation and updated predecessor
        if (recordState) {
          yield getState(u, edge, {
            key: "dijkstra.relax_edge",
            params: { from: edge.from, to: edge.to, newDist: alt }
          });
        }
      }
    }
  }

  // Clear current node and evaluating edge at completion
  if (recordState) {
    yield getState(null, null, { key: "dijkstra.complete" });
  }

  return { distances, predecessors };
}

/**
 * Standard utility wrapper to run Dijkstra's algorithm instantly.
 */
export function dijkstra<T extends string | number>(
  graph: Graph<T, boolean, WeightedEdge<T>>,
  startNode?: T
): DijkstraResult<T> {
  return runGenerator(dijkstraGenerator(graph, startNode, false));
}
