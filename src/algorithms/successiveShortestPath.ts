import { Graph } from "../core/Graph.ts";
import type { FlowEdge, ResidualEdge } from "../core/types.ts";
import { runGenerator, EPSILON, calculateTotalCost } from "./utils.ts";
import type { LocalizedNote } from "../lib/localization.ts";
import { createResidualGraph } from "./residualGraph.ts";
import { dijkstraGenerator } from "./sssp/dijkstra.ts";
import {
  type MCFStepState,
  validateMCFPreconditions,
  buildMCFStepState,
  findNegativeCycle,
  augmentFlow,
  calculateInitialPotentials,
  calculateImbalances,
  buildReducedCostGraph
} from "./mcfShared.ts";

export type SuccessiveShortestPathStepState<T extends string | number> =
  MCFStepState<T>;

/**
 * Successive Shortest Path MCF Generator. Yields step-by-step states for visualization.
 */
export function* successiveShortestPathGenerator<T extends string | number>(
  graph: Graph<T, true, FlowEdge<T>>,
  recordState: boolean = true,
  epsilon: number = EPSILON
): Generator<SuccessiveShortestPathStepState<T>, number, unknown> {
  const balances = validateMCFPreconditions(graph, epsilon);

  let clone = graph.clone();
  // Ensure initial flows are 0
  for (const node of clone.getNodes()) {
    for (const edge of clone.getNeighbors(node)) {
      (edge as FlowEdge<T>).flow = 0;
    }
  }

  let totalCost = 0;
  const V = clone.getNodes().length;

  const getStepState = (
    notes: LocalizedNote,
    residualGraph: Graph<T, true, ResidualEdge<T>> | null = null,
    resCurrentNode: T | null = null,
    resEvaluatingEdge: ResidualEdge<T> | null = null,
    resVisited: Set<T> = new Set(),
    resQueued: Set<T> = new Set(),
    highlightedPath: ResidualEdge<T>[] = []
  ): SuccessiveShortestPathStepState<T> => {
    return buildMCFStepState(
      clone,
      totalCost,
      notes,
      epsilon,
      residualGraph,
      resCurrentNode,
      resEvaluatingEdge,
      resVisited,
      resQueued,
      highlightedPath
    );
  };

  // Create the residual graph
  const residualGraph = createResidualGraph(clone);

  // Phase 1: Eliminate negative cycles from f = 0
  while (true) {
    const bfGen = findNegativeCycle(residualGraph, epsilon, false);

    let bfResult = bfGen.next();
    while (!bfResult.done) {
      bfResult = bfGen.next(); // Skip Bellman-Ford animation frames here
    }

    const cycleEdges = bfResult.value;
    if (!cycleEdges || cycleEdges.length === 0) {
      break; // No negative cycles
    }

    const gamma = Math.min(...cycleEdges.map((e) => e.capacity));

    // Augment flow along cycle to eliminate it and update residual capacities
    augmentFlow(cycleEdges, gamma);

    totalCost = calculateTotalCost(clone);

    if (recordState) {
      yield getStepState(
        {
          key: "successive_shortest_path.init_potentials"
        },
        residualGraph,
        null,
        null,
        new Set(),
        new Set(),
        cycleEdges
      );
    }
  }

  const potentials = calculateInitialPotentials(
    residualGraph,
    clone.getNodes(),
    epsilon
  );

  if (recordState) {
    yield getStepState({
      key: "successive_shortest_path.init_potentials"
    });
  }

  const MAX_NODES_FOR_ANIMATION = 50;
  const isSmallGraph = V <= MAX_NODES_FOR_ANIMATION;

  while (true) {
    // Calculate imbalances e(v) = b(v) - f^out(v) + f^in(v)
    const imbalances = calculateImbalances(clone, balances);

    // Find a supply node s with e(s) > 0
    let s: T | null = null;
    for (const [node, imb] of imbalances.entries()) {
      if (imb > epsilon) {
        s = node;
        break;
      }
    }

    // If no supply node exists, all imbalances must be 0, so optimal flow is reached
    if (s === null) {
      if (recordState) {
        yield getStepState({
          key: "successive_shortest_path.complete",
          params: { totalCost }
        });
      }
      break;
    }

    // Build the weighted graph with reduced costs as weights for Dijkstra
    const wGraph = buildReducedCostGraph(residualGraph, potentials, epsilon);

    // Run Dijkstra generator to find shortest paths from s
    const djGen = dijkstraGenerator(wGraph, s, recordState && isSmallGraph);
    let djResult = djGen.next();
    while (!djResult.done) {
      const step = djResult.value;
      if (recordState && isSmallGraph) {
        // Map the Dijkstra state to our step state
        const resEvaluating = step.evaluatingEdge
          ? (residualGraph
              .getNeighbors(step.currentNode!)
              .find(
                (e) => e.to === step.evaluatingEdge!.to && e.capacity > epsilon
              ) ?? null)
          : null;

        // Reconstruct highlighted edges from predecessors
        const pathEdges: ResidualEdge<T>[] = [];
        for (const [, predEdge] of step.predecessors.entries()) {
          if (
            predEdge?.ref &&
            (predEdge.ref as ResidualEdge<T>).capacity > epsilon
          ) {
            pathEdges.push(predEdge.ref as ResidualEdge<T>);
          }
        }

        yield getStepState(
          step.notes || { key: "dijkstra.start", params: { startNode: s } },
          residualGraph,
          step.currentNode,
          resEvaluating,
          step.visitedNodes,
          new Set(step.queue.map((q) => q.node)),
          pathEdges
        );
      }
      djResult = djGen.next();
    }

    const { distances, predecessors } = djResult.value;

    // Find a demand node t with e(t) < 0 that is reachable from s
    let t: T | null = null;
    let minDist = Infinity;
    for (const [node, imb] of imbalances.entries()) {
      if (imb < -epsilon) {
        const d = distances.get(node) ?? Infinity;
        if (d < minDist) {
          minDist = d;
          t = node;
        }
      }
    }

    // If no demand node is reachable, no b-flow is possible
    if (t === null || minDist === Infinity) {
      throw new Error("kein b-Fluss möglich");
    }

    if (recordState) {
      yield getStepState(
        {
          key: "successive_shortest_path.find_shortest_path",
          params: { s, t }
        },
        residualGraph
      );
    }

    // Reconstruct the shortest path from s to t
    const path: ResidualEdge<T>[] = [];
    const visited = new Set<T>([t]);
    let curr = t;
    while (curr !== s) {
      const predEdge = predecessors.get(curr);
      if (!predEdge || !predEdge.ref || visited.has(predEdge.from)) {
        throw new Error("kein b-Fluss möglich");
      }
      path.push(predEdge.ref as ResidualEdge<T>);
      curr = predEdge.from;
      visited.add(curr);
    }
    path.reverse();

    // Update potentials:
    // M = max dist of any reachable node
    let M = 0;
    for (const d of distances.values()) {
      if (d < Infinity && d > M) {
        M = d;
      }
    }

    for (const node of clone.getNodes()) {
      const d = distances.get(node) ?? Infinity;
      if (d < Infinity) {
        potentials.set(node, (potentials.get(node) ?? 0) - d);
      } else {
        potentials.set(node, (potentials.get(node) ?? 0) - M);
      }
    }

    // Determine bottleneck capacity
    const supplyS = imbalances.get(s) ?? 0;
    const demandT = -(imbalances.get(t) ?? 0);
    const edgeCapacities = path.map((e) => e.capacity);
    const gamma = Math.min(supplyS, demandT, ...edgeCapacities);

    // Augment flow
    augmentFlow(path, gamma);

    totalCost = calculateTotalCost(clone);

    if (recordState) {
      yield getStepState(
        {
          key: "successive_shortest_path.augment_flow",
          params: {
            s,
            t,
            gamma,
            path: [...path.map((e) => e.from), t],
            totalCost
          }
        },
        residualGraph,
        null,
        null,
        new Set(),
        new Set(),
        path
      );
    }
  }

  return totalCost;
}

/**
 * Standard utility wrapper to run Successive Shortest Path MCF algorithm instantly.
 */
export function successiveShortestPath<T extends string | number>(
  graph: Graph<T, true, FlowEdge<T>>
): number {
  return runGenerator(successiveShortestPathGenerator(graph, false));
}
