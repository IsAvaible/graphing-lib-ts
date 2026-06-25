import { Graph } from "../core/Graph.ts";
import type { FlowEdge, WeightedEdge, ResidualEdge } from "../core/types.ts";
import { runGenerator, resolveSourceAndSink, EPSILON } from "./utils.ts";
import { createResidualGraph } from "./residualGraph.ts";
import type { LocalizedNote } from "../lib/localization.ts";

export interface EdmondsKarpStepState<T> {
  currentNode: T | null;
  visitedNodes: Set<T>;
  queuedNodes: Set<T>;
  highlightedEdges: Set<string>; // Format: 'from->to' (main graph edges)
  frontierEdges: Set<string>; // Format: 'from->to' (main graph edges)
  evaluatingEdge: { from: T; to: T } | null; // (main graph edge)
  notes: LocalizedNote;
  graph: Graph<T, true, FlowEdge<T>>; // Current flow network clone
  maxFlow: number;

  // Residual graph specific state for visualization
  residualGraph: Graph<T, true, WeightedEdge<T>> | null;
  residualVisualState: {
    currentNode: T | null;
    visitedNodes: Set<T>;
    queuedNodes: Set<T>;
    highlightedEdges: Set<string>; // Format: 'from->to' (residual graph edges)
    frontierEdges: Set<string>; // Format: 'from->to' (residual graph edges)
    evaluatingEdge: { from: T; to: T } | null;
  } | null;
}

/**
 * Converts a residual graph into a weighted graph for visualization purposes.
 */
function convertToWeightedGraph<T extends string | number>(
  resGraph: Graph<T, true, ResidualEdge<T>>,
  epsilon: number = EPSILON
): Graph<T, true, WeightedEdge<T>> {
  const wGraph = new Graph<T, true, WeightedEdge<T>>(true);
  for (const node of resGraph.getNodes()) {
    wGraph.addNode(node);
  }
  for (const node of resGraph.getNodes()) {
    for (const edge of resGraph.getNeighbors(node)) {
      if (edge.capacity > epsilon) {
        wGraph.addEdge({
          kind: "weighted",
          from: edge.from,
          to: edge.to,
          weight: Number(edge.capacity.toFixed(5))
        });
      }
    }
  }
  return wGraph;
}

/**
 * Converts a weighted graph into a flow graph where weight is treated as capacity.
 */
export function convertToFlowGraph<T extends string | number>(
  weightedGraph: Graph<T, boolean, WeightedEdge<T>>
): Graph<T, true, FlowEdge<T>> {
  const flowGraph = new Graph<T, true, FlowEdge<T>>(true);
  for (const node of weightedGraph.getNodes()) {
    flowGraph.addNode(node);
  }
  for (const node of weightedGraph.getNodes()) {
    for (const edge of weightedGraph.getNeighbors(node)) {
      flowGraph.addEdge({
        kind: "flow",
        from: edge.from,
        to: edge.to,
        capacity: edge.weight,
        flow: 0
      });
    }
  }
  return flowGraph;
}

/**
 * Edmonds-Karp Max Flow Generator. Yields step-by-step states for visualization.
 */
export function* edmondsKarpGenerator<T extends string | number>(
  graph: Graph<T, true, FlowEdge<T>>,
  startNode?: T,
  endNode?: T,
  recordState: boolean = true,
  epsilon: number = EPSILON
): Generator<EdmondsKarpStepState<T>, number, unknown> {
  // Clone the graph
  const clone = graph.clone();

  const nodes = clone.getNodes();
  if (nodes.length < 2) {
    throw new Error(
      "Graph must have at least 2 nodes for max flow calculation."
    );
  }

  // Resolve source s and sink t
  const resolved = resolveSourceAndSink(clone, true, epsilon);
  const s = startNode !== undefined ? startNode : resolved.s;
  const t = endNode !== undefined ? endNode : resolved.t;

  if (s === null || t === null) {
    throw new Error(
      "Could not identify source and sink nodes. Ensure the graph has a valid flow."
    );
  }

  if (!clone.hasNode(s)) {
    throw new Error(`Source node '${s}' does not exist in the graph.`);
  }
  if (!clone.hasNode(t)) {
    throw new Error(`Sink node '${t}' does not exist in the graph.`);
  }

  let currentFlowValue = 0;

  // Create the residual graph once at the beginning
  const residualGraph = createResidualGraph(clone);

  if (recordState) {
    yield {
      currentNode: null,
      visitedNodes: new Set<T>(),
      queuedNodes: new Set<T>(),
      highlightedEdges: new Set<string>(),
      frontierEdges: new Set<string>(),
      evaluatingEdge: null,
      notes: {
        key: "edmonds_karp.start",
        params: { s, t }
      },
      graph: clone,
      maxFlow: currentFlowValue,
      residualGraph: null,
      residualVisualState: null
    };
  }

  while (true) {
    // Cache/reuse the visualized weightedGraph at the start of BFS
    let visualizedResidual = recordState
      ? convertToWeightedGraph(residualGraph, epsilon)
      : null;

    // BFS setup
    const queue: T[] = [s];
    let head = 0;
    const visited = new Set<T>([s]);
    const parentEdge = new Map<T, ResidualEdge<T>>();

    const getStepState = (
      resCurrentNode: T | null,
      resEvaluatingEdge: ResidualEdge<T> | null,
      notesVal: LocalizedNote,
      augmentingPathEdges?: ResidualEdge<T>[]
    ): EdmondsKarpStepState<T> => {
      const resVisited = new Set(visited);
      const resQueued = new Set(queue.slice(head));

      const resHighlighted = new Set<string>();
      if (augmentingPathEdges) {
        for (const e of augmentingPathEdges) {
          resHighlighted.add(`${e.from}->${e.to}`);
        }
      }

      const mainHighlighted = new Set<string>();
      if (augmentingPathEdges) {
        for (const e of augmentingPathEdges) {
          mainHighlighted.add(`${e.originalEdge.from}->${e.originalEdge.to}`);
        }
      }

      const residualVisualState = {
        currentNode: resCurrentNode,
        visitedNodes: resVisited,
        queuedNodes: resQueued,
        highlightedEdges: resHighlighted,
        frontierEdges: new Set<string>(),
        evaluatingEdge: resEvaluatingEdge
          ? { from: resEvaluatingEdge.from, to: resEvaluatingEdge.to }
          : null
      };

      return {
        currentNode: null,
        visitedNodes: new Set<T>(),
        queuedNodes: new Set<T>(),
        highlightedEdges: mainHighlighted,
        frontierEdges: new Set<string>(),
        evaluatingEdge: null,
        notes: notesVal,
        graph: clone,
        maxFlow: currentFlowValue,
        residualGraph: visualizedResidual,
        residualVisualState
      };
    };

    if (recordState) {
      yield getStepState(s, null, {
        key: "edmonds_karp.bfs_start",
        params: { s, t }
      });
    }

    // Run BFS
    while (head < queue.length) {
      const u = queue[head++];

      if (recordState) {
        yield getStepState(u, null, {
          key: "edmonds_karp.bfs_pop",
          params: { u }
        });
      }

      if (u === t) {
        break;
      }

      for (const edge of residualGraph.getNeighbors(u)) {
        const v = edge.to;
        // Introduce an epsilon constraint to represent absolute zero
        if (!visited.has(v) && edge.capacity > epsilon) {
          if (recordState) {
            yield getStepState(u, edge, {
              key: "edmonds_karp.bfs_examine_edge",
              params: { u, v, capacity: edge.capacity }
            });
          }

          visited.add(v);
          parentEdge.set(v, edge);
          queue.push(v);

          if (recordState) {
            yield getStepState(u, edge, {
              key: "edmonds_karp.bfs_edge_valid",
              params: { u, v }
            });
          }
        }
      }
    }

    // If no path to t was found, max flow is reached
    if (!parentEdge.has(t)) {
      if (recordState) {
        yield {
          currentNode: null,
          visitedNodes: new Set<T>(),
          queuedNodes: new Set<T>(),
          highlightedEdges: new Set<string>(),
          frontierEdges: new Set<string>(),
          evaluatingEdge: null,
          notes: {
            key: "edmonds_karp.no_path",
            params: { maxFlow: currentFlowValue }
          },
          graph: clone,
          maxFlow: currentFlowValue,
          residualGraph: null,
          residualVisualState: null
        };
      }
      break;
    }

    // Reconstruct path
    const path: ResidualEdge<T>[] = [];
    let curr = t;
    while (curr !== s) {
      const edge = parentEdge.get(curr)!;
      path.push(edge);
      curr = edge.from;
    }
    path.reverse();

    // Bottleneck flow calculation
    const delta = Math.min(...path.map((e) => e.capacity));

    if (recordState) {
      yield getStepState(
        null,
        null,
        {
          key: "edmonds_karp.path_found",
          params: { path: [...path.map((e) => e.from), t], delta }
        },
        path
      );
    }

    // Update flow along path
    for (const edge of path) {
      if (edge.isBackward) {
        edge.originalEdge.flow -= delta;
      } else {
        edge.originalEdge.flow += delta;
      }
      const newCapacity = edge.capacity - delta;

      // Push the new capacity to zero
      edge.capacity = newCapacity <= epsilon ? 0 : newCapacity;

      if (edge.companion) {
        edge.companion.capacity += delta;
      }
    }
    currentFlowValue += delta;

    // Update the visualized residual graph after the flow is augmented
    if (recordState) {
      visualizedResidual = convertToWeightedGraph(residualGraph);
    }

    if (recordState) {
      yield getStepState(
        null,
        null,
        {
          key: "edmonds_karp.augment_flow",
          params: { delta }
        },
        path
      );
    }
  }

  return currentFlowValue;
}

/**
 * Standard utility wrapper to run Edmonds-Karp max flow algorithm instantly.
 */
export function edmondsKarp<T extends string | number>(
  graph: Graph<T, true, FlowEdge<T>>,
  startNode?: T,
  endNode?: T
): number {
  if (!graph.isDirected) {
    throw new Error(
      "Edmonds-Karp algorithm strictly requires a directed graph."
    );
  }
  return runGenerator(edmondsKarpGenerator(graph, startNode, endNode, false));
}
