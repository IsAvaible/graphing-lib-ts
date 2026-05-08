import { kruskalsAlgorithm } from "../mst";
import { Graph } from "@/core/Graph.ts";
import type { WeightedEdge } from "@/core/types.ts";
import { depthFirstSearch } from "@/algorithms/search.ts";

/**
 * Represents a snapshot of the Double Tree algorithm at a specific step.
 * @template T The id-type of a vertex. Constrained to primitives.
 */
export interface DoubleTreeState<T extends string | number> {
  phase: "mst" | "dfs" | "complete";
  mstEdges: WeightedEdge<T>[];
  tourNodes: T[]; // Nodes visited so far in the TSP tour
  tourEdges: WeightedEdge<T>[]; // Edges forming the TSP tour
  evaluatingNode: T | null;
  evaluatingEdge: WeightedEdge<T> | null;
}

/**
 * A Generator that yields the state of the Double Tree Algorithm.
 * Note: This algorithm assumes the input graph is a COMPLETE graph satisfying
 * the triangle inequality (Metric TSP).
 */
export function* doubleTreeAlgorithmGenerator<T extends string | number>(
  graph: Graph<T>,
  recordState: boolean = true
): Generator<DoubleTreeState<T>, WeightedEdge<T>[], unknown> {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return [];

  // Step 1: Compute the Minimum Spanning Tree
  const mstEdges = kruskalsAlgorithm(graph);

  if (recordState) {
    yield {
      phase: "mst",
      mstEdges: [...mstEdges],
      tourNodes: [],
      tourEdges: [],
      evaluatingNode: null,
      evaluatingEdge: null
    };
  }

  const mstGraph = Graph.fromEdges(mstEdges, false);

  const tourNodes: T[] = [];
  const tourEdges: WeightedEdge<T>[] = [];
  const visited = new Set<T>();

  const getRequiredEdge = (from: T, to: T): WeightedEdge<T> => {
    const edge = graph.getEdge(from, to) as WeightedEdge<T> | undefined;
    if (!edge) {
      throw new Error(`Missing edge ${from}->${to}. Graph must be complete.`);
    }
    return edge;
  };

  // Step 2 & 3: Simulate the Eulerian Tour + Shortcuts
  const dfsGenerator = depthFirstSearch(
    mstGraph,
    nodes[0],
    visited,
    recordState
  );
  let step = dfsGenerator.next();

  // Handle the yielded intermediate states
  while (!step.done) {
    const current = step.value.currentNode;
    let newTourEdge: WeightedEdge<T> | null = null;

    if (tourNodes.length > 0) {
      const prev = tourNodes[tourNodes.length - 1];
      newTourEdge = getRequiredEdge(prev, current);
      tourEdges.push(newTourEdge);
    }

    tourNodes.push(current);

    yield {
      phase: "dfs",
      mstEdges: [...mstEdges],
      tourNodes: [...tourNodes],
      tourEdges: [...tourEdges],
      evaluatingNode: current,
      evaluatingEdge: newTourEdge
    };

    step = dfsGenerator.next();
  }

  // If recordState was false, build the tour from the returned DFS visited set
  if (!recordState) {
    tourNodes.push(...step.value); // Set iteration preserves insertion order
    for (let i = 1; i < tourNodes.length; i++) {
      tourEdges.push(getRequiredEdge(tourNodes[i - 1], tourNodes[i]));
    }
  }

  // Step 4: Complete the Hamiltonian cycle
  if (tourNodes.length > 1) {
    const firstNode = tourNodes[0];
    const lastNode = tourNodes[tourNodes.length - 1];
    tourEdges.push(getRequiredEdge(lastNode, firstNode));
  }

  if (recordState) {
    yield {
      phase: "complete",
      mstEdges: [...mstEdges],
      tourNodes: [...tourNodes],
      tourEdges: [...tourEdges],
      evaluatingNode: null,
      evaluatingEdge: null
    };
  }

  return tourEdges;
}

/**
 * Standard utility wrapper to run the Double Tree algorithm instantly.
 */
export function doubleTreeAlgorithm<T extends string | number>(
  graph: Graph<T>
): WeightedEdge<T>[] {
  const generator = doubleTreeAlgorithmGenerator(graph, false);
  const result = generator.next();

  if (!result.done) {
    throw new Error(
      "Generator should have been exhausted since recordState is false."
    );
  }
  return result.value;
}
