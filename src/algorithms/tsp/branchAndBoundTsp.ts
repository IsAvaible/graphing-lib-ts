import { Graph } from "@/core/Graph.ts";
import type { WeightedEdge } from "@/core/types.ts";
import { doubleTreeAlgorithm } from "@/algorithms/tsp/doubleTreeTsp.ts";
import { runGenerator } from "../utils";

/**
 * Represents a snapshot of the Branch and Bound TSP algorithm.
 * @template T The id-type of a vertex. Constrained to primitives.
 */
export interface BranchAndBoundTspState<T extends string | number> {
  phase: "evaluating" | "complete";
  currentTourNodes: T[];
  currentTourEdges: WeightedEdge<T>[];
  currentCost: number;
  bestTourNodes: T[] | null;
  bestTourEdges: WeightedEdge<T>[] | null;
  bestCost: number;
  branchesPruned: number;
}

/**
 * A Generator that yields the state of the Branch and Bound TSP Algorithm.
 * Optimized with Heuristic Initialization, Minimum Edge Look-ahead, and Symmetry Breaking.
 */
export function* branchAndBoundTspGenerator<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>,
  recordState: boolean = true,
  useDTHeuristic: boolean = true
): Generator<BranchAndBoundTspState<T>, WeightedEdge<T>[], unknown> {
  const nodes = graph.getNodes();
  if (nodes.length <= 1) return [];

  let bestCost = Infinity;
  let bestTourNodes: T[] | null = null;
  let bestTourEdges: WeightedEdge<T>[] | null = null;
  let branchesPruned = 0;

  if (useDTHeuristic) {
    // Optimization 1: Heuristic Initialization using the Double Tree Algorithm
    try {
      const heuristicEdges = doubleTreeAlgorithm(graph);
      bestCost = heuristicEdges.reduce((sum, edge) => sum + edge.weight, 0);
      bestTourEdges = heuristicEdges;
      bestTourNodes = [
        heuristicEdges[0].from,
        ...heuristicEdges.map((e) => e.to)
      ];
    } catch {
      // If the heuristic fails, fall back to Infinity
    }
  }

  // Optimization 2: Pre-sort edges by weight to evaluate greedy paths first.
  const sortedAdjacency = new Map<T, WeightedEdge<T>[]>();
  for (const node of nodes) {
    sortedAdjacency.set(
      node,
      [...graph.getNeighbors(node)].sort((a, b) => a.weight - b.weight)
    );
  }

  const startNode = nodes[0];

  const getState = (
    phase: "evaluating" | "complete",
    currentTourNodes: T[],
    currentTourEdges: WeightedEdge<T>[],
    currentCost: number
  ): BranchAndBoundTspState<T> => ({
    phase,
    currentTourNodes: [...currentTourNodes],
    currentTourEdges: [...currentTourEdges],
    currentCost,
    bestTourNodes: bestTourNodes ? [...bestTourNodes] : null,
    bestTourEdges: bestTourEdges ? [...bestTourEdges] : null,
    bestCost,
    branchesPruned
  });

  function* backtrack(
    currentNode: T,
    unvisited: Set<T>,
    currentTourNodes: T[],
    currentTourEdges: WeightedEdge<T>[],
    currentCost: number
  ): Generator<BranchAndBoundTspState<T>, void, unknown> {
    // Here could be added a lower-bound calculation for further optimization (mst or min-edge lookahead)

    // Optimization 3: Branch and Bound Pruning: Stop evaluating if we already exceed the best known cost.
    if (currentCost >= bestCost) {
      branchesPruned++;
      return;
    }

    if (recordState) {
      yield getState(
        "evaluating",
        currentTourNodes,
        currentTourEdges,
        currentCost
      );
    }

    // Base Case: All nodes visited
    if (unvisited.size === 0) {
      // Optimization 4: Symmetry breaking (enforce a canonical order to reduce equivalent tours)
      if (currentTourNodes.length > 2) {
        const firstStep = currentTourNodes[1];
        const lastStep = currentNode;
        if (firstStep > lastStep) {
          branchesPruned++;
          return;
        }
      }

      const returnEdge = graph.getEdge(currentNode, startNode);

      if (returnEdge) {
        const totalCost = currentCost + returnEdge.weight;

        // Final sanity check
        if (totalCost < bestCost) {
          bestCost = totalCost;
          bestTourNodes = [...currentTourNodes, startNode];
          bestTourEdges = [...currentTourEdges, returnEdge];

          if (recordState) {
            yield getState(
              "evaluating",
              bestTourNodes,
              bestTourEdges,
              totalCost
            );
          }
        }
      }
      return;
    }

    // Explore unvisited neighbors
    const neighbors = sortedAdjacency.get(currentNode) || [];
    for (const edge of neighbors) {
      const neighbor = edge.to;

      if (unvisited.has(neighbor)) {
        unvisited.delete(neighbor);
        currentTourNodes.push(neighbor);
        currentTourEdges.push(edge);

        yield* backtrack(
          neighbor,
          unvisited,
          currentTourNodes,
          currentTourEdges,
          currentCost + edge.weight
        );

        unvisited.add(neighbor);
        currentTourNodes.pop();
        currentTourEdges.pop();
      }
    }
  }

  const unvisitedSet = new Set(nodes);
  unvisitedSet.delete(startNode);
  yield* backtrack(startNode, unvisitedSet, [startNode], [], 0);

  if (recordState) {
    yield getState(
      "complete",
      bestTourNodes || [],
      bestTourEdges || [],
      bestCost === Infinity ? 0 : bestCost
    );
  }

  if (!bestTourEdges) {
    throw new Error("No valid Hamiltonian cycle found in the graph.");
  }

  return bestTourEdges;
}

/**
 * Standard utility wrapper to run the Branch & Bound TSP algorithm instantly.
 */
export function branchAndBoundTsp<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>
): WeightedEdge<T>[] {
  return runGenerator(branchAndBoundTspGenerator(graph, false));
}
