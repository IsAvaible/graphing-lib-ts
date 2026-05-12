import { Graph } from "@/core/Graph";
import type { WeightedEdge } from "@/core/types";

/**
 * Represents a snapshot of the Nearest Neighbor TSP algorithm at a specific step.
 */
export interface NearestNeighborState<T extends string | number> {
  phase: "searching" | "complete";
  tourNodes: T[];
  tourEdges: WeightedEdge<T>[];
  unvisitedNodes: Set<T>;
  evaluatingNode: T | null;
  evaluatingEdge: WeightedEdge<T> | null;
}

/**
 * A Generator that yields the state of the Nearest Neighbor TSP Algorithm.
 */
export function* nearestNeighborTspGenerator<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>,
  startNode?: T,
  recordState: boolean = true
): Generator<NearestNeighborState<T>, WeightedEdge<T>[], unknown> {
  const nodes = graph.getNodes();
  if (!nodes.length) return [];

  const initialNode =
    startNode !== undefined && graph.hasNode(startNode) ? startNode : nodes[0];
  const unvisitedNodes = new Set<T>(nodes);
  const tourNodes: T[] = [initialNode];
  const tourEdges: WeightedEdge<T>[] = [];

  unvisitedNodes.delete(initialNode);
  let currentNode = initialNode;

  // Helper for the state-yielding logic
  const getState = (
    phase: "searching" | "complete",
    evaluatingNode: T | null = null,
    evaluatingEdge: WeightedEdge<T> | null = null
  ): NearestNeighborState<T> => ({
    phase,
    tourNodes: [...tourNodes],
    tourEdges: [...tourEdges],
    unvisitedNodes: new Set(unvisitedNodes),
    evaluatingNode,
    evaluatingEdge
  });

  if (recordState) yield getState("searching", currentNode);

  // Pick the closest unvisited neighbor until all nodes are visited
  while (unvisitedNodes.size > 0) {
    let minEdge: WeightedEdge<T> | null = null;
    let minWeight = Infinity;

    // Scan neighbors to find the absolute closest unvisited node
    for (const edge of graph.getNeighbors(currentNode)) {
      if (unvisitedNodes.has(edge.to)) {
        if (edge.weight < minWeight) {
          minWeight = edge.weight;
          minEdge = edge;
        }
      }
    }

    if (!minEdge) {
      throw new Error(
        `Graph is disconnected or incomplete. Stuck at node ${currentNode} with unvisited nodes remaining.`
      );
    }

    // Move to the next node
    tourNodes.push(minEdge.to);
    tourEdges.push(minEdge);
    unvisitedNodes.delete(minEdge.to);

    if (recordState) yield getState("searching", currentNode, minEdge);

    currentNode = minEdge.to;
  }

  // Complete the Hamiltonian cycle by returning to the start node
  if (tourNodes.length > 1) {
    const closingEdge = graph.getEdge(currentNode, initialNode);
    if (!closingEdge) {
      throw new Error(
        `Missing edge to complete tour ${currentNode}->${initialNode}.`
      );
    }
    tourEdges.push(closingEdge);
  }

  if (recordState) yield getState("complete");

  return tourEdges;
}

/**
 * Standard utility wrapper to run the Nearest Neighbor algorithm instantly.
 */
export function nearestNeighborTsp<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>,
  startNode?: T
): WeightedEdge<T>[] {
  const generator = nearestNeighborTspGenerator(graph, startNode, false);
  const result = generator.next();

  if (!result.done) {
    throw new Error(
      "Generator should have been exhausted since recordState is false."
    );
  }
  return result.value;
}
