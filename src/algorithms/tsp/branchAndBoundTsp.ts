import { Graph } from "@/core/Graph.ts";
import type { WeightedEdge } from "@/core/types.ts";

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
 * Evaluates permutations but aggressively prunes paths that exceed the current best cost.
 */
export function* branchAndBoundTspGenerator<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>,
  recordState: boolean = true
): Generator<BranchAndBoundTspState<T>, WeightedEdge<T>[], unknown> {
  const nodes = graph.getNodes();
  if (nodes.length <= 1) return [];

  let bestCost = Infinity;
  let bestTourNodes: T[] | null = null;
  let bestTourEdges: WeightedEdge<T>[] | null = null;
  let branchesPruned = 0;

  // Pre-sort edges by weight to evaluate greedy paths first.
  // This establishes a very tight `bestCost` early, maximizing pruning efficiency.
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
    visited: Set<T>,
    currentTourNodes: T[],
    currentTourEdges: WeightedEdge<T>[],
    currentCost: number
  ): Generator<BranchAndBoundTspState<T>, void, unknown> {
    // Branch and Bound Pruning: Stop evaluating if we already exceed the best known cost.
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
    if (visited.size === nodes.length) {
      const returnEdge = graph.getEdge(currentNode, startNode);

      if (returnEdge) {
        const totalCost = currentCost + returnEdge.weight;

        // Final bounds check before committing
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

    // Explore unvisited neighbors via the pre-sorted list
    const neighbors = sortedAdjacency.get(currentNode) || [];
    for (const edge of neighbors) {
      const neighbor = edge.to;

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        currentTourNodes.push(neighbor);
        currentTourEdges.push(edge);

        yield* backtrack(
          neighbor,
          visited,
          currentTourNodes,
          currentTourEdges,
          currentCost + edge.weight
        );

        visited.delete(neighbor);
        currentTourNodes.pop();
        currentTourEdges.pop();
      }
    }
  }

  const visited = new Set<T>([startNode]);
  yield* backtrack(startNode, visited, [startNode], [], 0);

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
  const generator = branchAndBoundTspGenerator(graph, false);
  const result = generator.next();

  if (!result.done) {
    throw new Error(
      "Generator should have been exhausted since recordState is false."
    );
  }
  return result.value;
}
