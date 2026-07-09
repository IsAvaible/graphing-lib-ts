import { Graph } from "../core/Graph.ts";
import type { FlowEdge, ResidualEdge } from "../core/types.ts";
import { runGenerator, EPSILON, calculateTotalCost } from "./utils.ts";
import type { LocalizedNote } from "../lib/localization.ts";
import { createResidualGraph } from "./residualGraph.ts";
import {
  type MCFStepState,
  validateMCFPreconditions,
  buildMCFStepState,
  findNegativeCycle,
  augmentFlow
} from "./mcfShared.ts";
import { edmondsKarp } from "@/algorithms/edmondsKarp.ts";

export type CycleCancelingStepState<T extends string | number> =
  MCFStepState<T>;

/**
 * Finds a feasible initial b-flow using Edmonds-Karp max flow on an auxiliary network.
 * Returns null if no feasible b-flow is possible.
 */
function findInitialBFlow<T extends string | number>(
  graph: Graph<T, true, FlowEdge<T>>,
  balances: Map<T, number>,
  epsilon: number = EPSILON
): Graph<T, true, FlowEdge<T>> | null {
  const clone = graph.clone();
  const nodes = clone.getNodes();

  // Determine unique IDs for auxiliary source and sink
  let s: T;
  let t: T;
  if (nodes.length > 0 && typeof nodes[0] === "number") {
    const maxVal = Math.max(...(nodes as number[]));
    s = (maxVal + 1) as T;
    t = (maxVal + 2) as T;
  } else {
    s = "__super_source__" as T;
    t = "__super_sink__" as T;
  }

  // Build the auxiliary network
  const auxGraph = new Graph<T, true, FlowEdge<T>>(true);
  for (const node of nodes) {
    auxGraph.addNode(node);
  }
  for (const node of nodes) {
    for (const edge of clone.getNeighbors(node)) {
      auxGraph.addEdge({
        kind: "flow",
        from: edge.from,
        to: edge.to,
        capacity: edge.capacity,
        flow: 0,
        cost: edge.cost
      });
    }
  }

  auxGraph.addNode(s);
  auxGraph.addNode(t);

  let sumSupply = 0;
  for (const [node, balance] of balances.entries()) {
    if (balance > 0) {
      auxGraph.addEdge({
        kind: "flow",
        from: s,
        to: node,
        capacity: balance,
        flow: 0,
        cost: 0
      });
      sumSupply += balance;
    } else if (balance < 0) {
      auxGraph.addEdge({
        kind: "flow",
        from: node,
        to: t,
        capacity: -balance,
        flow: 0,
        cost: 0
      });
    }
  }

  // Run Edmonds-Karp
  const { maxFlow, flowGraph } = edmondsKarp(auxGraph, s, t);

  // Check if max flow satisfies all supplies
  if (Math.abs(maxFlow - sumSupply) > epsilon) {
    return null; // Feasible b-flow not possible
  }

  // Copy flow values back
  for (const node of clone.getNodes()) {
    for (const edge of clone.getNeighbors(node)) {
      const solvedEdge = flowGraph.getEdge(edge.from, edge.to);
      if (solvedEdge) {
        (edge as FlowEdge<T>).flow = solvedEdge.flow;
      }
    }
  }

  return clone;
}

/**
 * Cycle-Canceling MCF Generator. Yields step-by-step states for visualization.
 */
export function* cycleCancelingGenerator<T extends string | number>(
  graph: Graph<T, true, FlowEdge<T>>,
  recordState: boolean = true,
  epsilon: number = EPSILON
): Generator<CycleCancelingStepState<T>, number, unknown> {
  const balances = validateMCFPreconditions(graph, epsilon);

  let clone = graph.clone();
  let totalCost = 0;

  const getStepState = (
    notes: LocalizedNote,
    residualGraph: Graph<T, true, ResidualEdge<T>> | null = null,
    resCurrentNode: T | null = null,
    resEvaluatingEdge: ResidualEdge<T> | null = null,
    parentMap?: Map<T, ResidualEdge<T> | null>,
    cycleEdges?: ResidualEdge<T>[]
  ): CycleCancelingStepState<T> => {
    let highlightedResEdges: ResidualEdge<T>[] = [];
    if (cycleEdges) {
      highlightedResEdges = cycleEdges;
    } else if (parentMap) {
      highlightedResEdges = Array.from(parentMap.values()).filter(
        Boolean
      ) as ResidualEdge<T>[];
    }

    return buildMCFStepState(
      clone,
      totalCost,
      notes,
      epsilon,
      residualGraph,
      resCurrentNode,
      resEvaluatingEdge,
      new Set<T>(),
      new Set<T>(),
      highlightedResEdges
    );
  };

  // Phase 1: Find a feasible b-flow
  if (recordState) {
    yield getStepState({ key: "cycle_canceling.search_initial_flow" });
  }

  const initialFlowGraph = findInitialBFlow(graph, balances, epsilon);
  if (!initialFlowGraph) {
    throw new Error("kein b-Fluss möglich");
  }

  clone = initialFlowGraph;
  totalCost = calculateTotalCost(clone);

  if (recordState) {
    yield getStepState({
      key: "cycle_canceling.initial_flow_found",
      params: { totalCost }
    });
  }

  const V = clone.getNodes().length;
  const MAX_NODES_FOR_ANIMATION = 50;
  const isSmallGraph = V <= MAX_NODES_FOR_ANIMATION;

  // Create the residual graph ONCE before the cycle-canceling loop
  const residualGraph = createResidualGraph(clone);

  // Phase 2: Cancel negative cost cycles
  while (true) {
    // Run Bellman-Ford generator to find negative cycles
    const bfGen = findNegativeCycle(residualGraph, epsilon);
    let bfResult = bfGen.next();
    while (!bfResult.done) {
      const step = bfResult.value;
      if (recordState && isSmallGraph) {
        yield getStepState(
          {
            key: "cycle_canceling.bf_relax_edge",
            params: {
              iteration: step.iteration,
              u: step.u,
              v: step.edge.to,
              cost: step.edge.cost
            }
          },
          residualGraph,
          step.u,
          step.edge,
          step.parent
        );
      }
      bfResult = bfGen.next();
    }
    const cycleEdges = bfResult.value;

    if (cycleEdges === null) {
      // No negative cycle, flow is optimal!
      if (recordState) {
        yield getStepState({
          key: "cycle_canceling.no_negative_cycle",
          params: { totalCost }
        });
      }
      break;
    }

    const gamma = Math.min(...cycleEdges.map((e) => e.capacity));

    if (recordState) {
      yield getStepState(
        {
          key: "cycle_canceling.negative_cycle_found",
          params: {
            cycle: [
              ...cycleEdges.map((e) => e.from),
              cycleEdges[cycleEdges.length - 1].to
            ],
            gamma
          }
        },
        residualGraph,
        null,
        null,
        undefined,
        cycleEdges
      );
    }

    // Augment flow and adjust the residual graph
    augmentFlow(cycleEdges, gamma);

    // Update total cost
    totalCost = calculateTotalCost(clone);

    if (recordState) {
      yield getStepState(
        {
          key: "cycle_canceling.cycle_eliminated",
          params: { gamma, totalCost }
        },
        residualGraph,
        null,
        null,
        undefined,
        cycleEdges
      );
    }
  }

  return totalCost;
}

/**
 * Standard utility wrapper to run Cycle-Canceling MCF algorithm instantly.
 */
export function cycleCanceling<T extends string | number>(
  graph: Graph<T, true, FlowEdge<T>>
): number {
  return runGenerator(cycleCancelingGenerator(graph, false));
}
