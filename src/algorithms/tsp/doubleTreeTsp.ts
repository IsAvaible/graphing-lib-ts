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
  tourNodes: T[];
  tourEdges: WeightedEdge<T>[];
  evaluatingNode: T | null;
  evaluatingEdge: WeightedEdge<T> | null;
}

/**
 * A Generator that yields the state of the Double Tree Algorithm.
 * Only works on metric graphs.
 */
export function* doubleTreeAlgorithmGenerator<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>,
  recordState: boolean = true
): Generator<DoubleTreeState<T>, WeightedEdge<T>[], unknown> {
  const nodes = graph.getNodes();
  if (nodes.length <= 1) return [];

  // Step 1: Compute the Minimum Spanning Tree
  const mstEdges = kruskalsAlgorithm(graph);
  const tourNodes: T[] = [];
  const tourEdges: WeightedEdge<T>[] = [];

  // Helper closure for state yielding
  const getState = (
    phase: "mst" | "dfs" | "complete",
    evaluatingNode: T | null = null,
    evaluatingEdge: WeightedEdge<T> | null = null
  ): DoubleTreeState<T> => ({
    phase,
    mstEdges: [...mstEdges],
    tourNodes: [...tourNodes],
    tourEdges: [...tourEdges],
    evaluatingNode,
    evaluatingEdge
  });

  if (recordState) yield getState("mst");

  const mstGraph = Graph.fromEdges(mstEdges, false);
  const visited = new Set<T>();

  const getRequiredEdge = (from: T, to: T): WeightedEdge<T> => {
    const edge = graph.getEdge(from, to);
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

  // Helper to handle tour edge appending
  const processNode = (current: T) => {
    let newTourEdge: WeightedEdge<T> | null = null;
    if (tourNodes.length > 0) {
      const prev = tourNodes[tourNodes.length - 1];
      newTourEdge = getRequiredEdge(prev, current);
      tourEdges.push(newTourEdge);
    }
    tourNodes.push(current);
    return newTourEdge;
  };

  let step = dfsGenerator.next();
  if (recordState) {
    while (!step.done) {
      const current = step.value.currentNode;
      const newTourEdge = processNode(current);
      yield getState("dfs", current, newTourEdge);
      step = dfsGenerator.next();
    }
  } else {
    if (!step.done) {
      throw Error("DFS generator yielded when recordState was false.");
    }

    const finalVisitedNodes = step.value;
    for (const current of finalVisitedNodes) {
      processNode(current);
    }
  }

  // Step 4: Complete the Hamiltonian cycle
  if (tourNodes.length > 1) {
    const firstNode = tourNodes[0];
    const lastNode = tourNodes[tourNodes.length - 1];
    tourEdges.push(getRequiredEdge(lastNode, firstNode));
  }

  if (recordState) yield getState("complete");

  return tourEdges;
}

/**
 * Standard utility wrapper to run the Double Tree algorithm instantly.
 */
export function doubleTreeAlgorithm<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>
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
