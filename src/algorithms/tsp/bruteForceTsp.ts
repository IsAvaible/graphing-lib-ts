import { Graph } from "@/core/Graph.ts";
import type { WeightedEdge } from "@/core/types.ts";
import { runGenerator } from "../utils";
import type { LocalizedNote } from "@/lib/localization.ts";

/**
 * Represents a snapshot of the Brute-Force TSP algorithm at a specific step.
 * @template T The id-type of a vertex. Constrained to primitives.
 */
export interface BruteForceTspState<T extends string | number> {
  phase: "evaluating" | "complete";
  currentTourNodes: T[];
  currentTourEdges: WeightedEdge<T>[];
  currentCost: number;
  bestTourNodes: T[] | null;
  bestTourEdges: WeightedEdge<T>[] | null;
  bestCost: number;
  permutationsEvaluated: number;
  notes?: LocalizedNote;
}

/**
 * A Generator that yields the state of the Brute-Force TSP Algorithm.
 * Evaluates all possible permutations to find the exact optimal Hamiltonian cycle.
 */
export function* bruteForceTspGenerator<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>,
  recordState: boolean = true
): Generator<BruteForceTspState<T>, WeightedEdge<T>[], unknown> {
  const nodes = graph.getNodes();
  if (nodes.length <= 1) return [];

  let bestCost = Infinity;
  let bestTourNodes: T[] | null = null;
  let bestTourEdges: WeightedEdge<T>[] | null = null;
  let permutationsEvaluated = 0;

  // Anchor the starting node to reduce permutations from O(n!) to O((n-1)!)
  const startNode = nodes[0];

  // Helper closure for state yielding
  const getState = (
    phase: "evaluating" | "complete",
    currentTourNodes: T[],
    currentTourEdges: WeightedEdge<T>[],
    currentCost: number,
    notes?: LocalizedNote
  ): BruteForceTspState<T> => ({
    phase,
    currentTourNodes: [...currentTourNodes],
    currentTourEdges: [...currentTourEdges],
    currentCost,
    bestTourNodes: bestTourNodes ? [...bestTourNodes] : null,
    bestTourEdges: bestTourEdges ? [...bestTourEdges] : null,
    bestCost,
    permutationsEvaluated,
    notes
  });

  /**
   * Recursive backtracking function to generate all possible paths
   */
  function* backtrack(
    currentNode: T,
    visited: Set<T>,
    currentTourNodes: T[],
    currentTourEdges: WeightedEdge<T>[],
    currentCost: number
  ): Generator<BruteForceTspState<T>, void, unknown> {
    // Base Case: All nodes have been visited exactly once
    if (visited.size === nodes.length) {
      const returnEdge = graph.getEdge(currentNode, startNode);

      // If a valid return edge exists, the Hamiltonian cycle is complete
      if (returnEdge) {
        permutationsEvaluated++;
        const totalCost = currentCost + returnEdge.weight;
        const fullTourNodes = [...currentTourNodes, startNode];
        const fullTourEdges = [...currentTourEdges, returnEdge];

        if (totalCost < bestCost) {
          bestCost = totalCost;
          bestTourNodes = fullTourNodes;
          bestTourEdges = fullTourEdges;
        }

        if (recordState) {
          yield getState(
            "evaluating",
            fullTourNodes,
            fullTourEdges,
            totalCost,
            {
              key: "brute_force.evaluating",
              params: {
                tour: fullTourNodes,
                cost: totalCost,
                bestCost: bestCost === Infinity ? "-" : bestCost
              }
            }
          );
        }
      }
      return;
    }

    // Try all unvisited neighbors to continue building the path
    for (const neighbor of nodes) {
      if (!visited.has(neighbor)) {
        const edge = graph.getEdge(currentNode, neighbor);

        // Only proceed if a valid edge connects the nodes
        if (edge) {
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

          // Backtrack state for the next permutation iteration
          visited.delete(neighbor);
          currentTourNodes.pop();
          currentTourEdges.pop();
        }
      }
    }
  }

  // Initialize backtracking search
  const visited = new Set<T>([startNode]);
  yield* backtrack(startNode, visited, [startNode], [], 0);

  if (recordState) {
    yield getState(
      "complete",
      bestTourNodes || [],
      bestTourEdges || [],
      bestCost === Infinity ? 0 : bestCost,
      {
        key: "brute_force.complete",
        params: {
          bestCost: bestCost === Infinity ? 0 : bestCost
        }
      }
    );
  }

  if (!bestTourEdges) {
    throw new Error("No valid Hamiltonian cycle found in the graph.");
  }

  return bestTourEdges;
}

/**
 * Standard utility wrapper to run the Brute-Force TSP algorithm instantly.
 */
export function bruteForceTsp<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>
): WeightedEdge<T>[] {
  return runGenerator(bruteForceTspGenerator(graph, false));
}
