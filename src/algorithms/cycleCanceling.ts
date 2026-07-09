import { Graph } from "../core/Graph.ts";
import type { FlowEdge, WeightedEdge, ResidualEdge } from "../core/types.ts";
import { runGenerator, EPSILON } from "./utils.ts";
import type { LocalizedNote } from "../lib/localization.ts";
import { createResidualGraph } from "./residualGraph.ts";

export interface CycleCancelingStepState<T> {
  currentNode: T | null;
  visitedNodes: Set<T>;
  queuedNodes: Set<T>;
  highlightedEdges: Set<string>; // Format: 'from->to' (main graph edges)
  frontierEdges: Set<string>; // Format: 'from->to' (main graph edges)
  evaluatingEdge: { from: T; to: T } | null; // (main graph edge)
  notes: LocalizedNote;
  graph: Graph<T, true, FlowEdge<T>>; // Current flow network clone
  totalCost: number;

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

interface RelaxationStep<T> {
  u: T;
  edge: ResidualEdge<T>;
  iteration: number;
  parent: Map<T, ResidualEdge<T> | null>;
}

function convertToWeightedMCFResidualGraph<T extends string | number>(
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
          weight: Number(edge.capacity.toFixed(5)),
          cost: edge.cost
        } as unknown as WeightedEdge<T>);
      }
    }
  }
  return wGraph;
}

function calculateTotalCost<T>(graph: Graph<T, true, FlowEdge<T>>): number {
  let cost = 0;
  for (const node of graph.getNodes()) {
    for (const edge of graph.getNeighbors(node)) {
      cost += edge.flow * (edge.cost ?? 0);
    }
  }
  return cost;
}

function* findNegativeCycle<T extends string | number>(
  residualGraph: Graph<T, true, ResidualEdge<T>>,
  epsilon: number = EPSILON
): Generator<RelaxationStep<T>, ResidualEdge<T>[] | null, unknown> {
  const V = residualGraph.getNodes().length;
  const dist = new Map<T, number>();
  const parent = new Map<T, ResidualEdge<T> | null>();

  for (const node of residualGraph.getNodes()) {
    dist.set(node, 0);
    parent.set(node, null);
  }

  let anyRelaxation = false;
  for (let i = 1; i < V; i++) {
    anyRelaxation = false;
    for (const u of residualGraph.getNodes()) {
      const distU = dist.get(u) ?? 0;
      for (const edge of residualGraph.getNeighbors(u)) {
        if (edge.capacity > epsilon) {
          const v = edge.to;
          const alt = distU + edge.cost;
          const distV = dist.get(v) ?? Infinity;

          if (alt < distV - epsilon) {
            dist.set(v, alt);
            parent.set(v, edge);
            anyRelaxation = true;

            yield { u, edge, iteration: i, parent: new Map(parent) };
          }
        }
      }
    }
    if (!anyRelaxation) return null;
  }

  // Check for negative-cost cycle in iteration V
  let cycleNode: T | null = null;

  for (const u of residualGraph.getNodes()) {
    const distU = dist.get(u) ?? 0;
    for (const edge of residualGraph.getNeighbors(u)) {
      if (edge.capacity > epsilon) {
        const v = edge.to;
        const alt = distU + edge.cost;
        const distV = dist.get(v) ?? Infinity;

        if (alt < distV - epsilon) {
          cycleNode = v;
          break;
        }
      }
    }
    if (cycleNode !== null) break;
  }

  if (cycleNode === null) {
    return null;
  }

  // Reconstruct the cycle
  let curr = cycleNode;
  for (let i = 0; i < V; i++) {
    const pEdge = parent.get(curr);
    if (pEdge) {
      curr = pEdge.from;
    } else {
      break;
    }
  }

  const cycleEdges: ResidualEdge<T>[] = [];
  const visitedInCycle = new Set<T>();
  let temp = curr;

  while (!visitedInCycle.has(temp)) {
    visitedInCycle.add(temp);
    const pEdge = parent.get(temp);
    if (!pEdge) break;
    cycleEdges.push(pEdge);
    temp = pEdge.from;
  }

  cycleEdges.reverse();
  return cycleEdges;
}

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
    s = (maxVal + 1) as unknown as T;
    t = (maxVal + 2) as unknown as T;
  } else {
    s = "__super_source__" as unknown as T;
    t = "__super_sink__" as unknown as T;
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

  while (true) {
    const resGraph = createResidualGraph(auxGraph);
    const queue: T[] = [s];
    const visited = new Set<T>([s]);
    const parentEdge = new Map<T, ResidualEdge<T>>();
    let head = 0;

    while (head < queue.length) {
      const u = queue[head++];
      if (u === t) break;

      for (const edge of resGraph.getNeighbors(u)) {
        const v = edge.to;
        if (!visited.has(v) && edge.capacity > epsilon) {
          visited.add(v);
          parentEdge.set(v, edge);
          queue.push(v);
        }
      }
    }

    if (!parentEdge.has(t)) break;

    // Find bottleneck
    let curr = t;
    const path: ResidualEdge<T>[] = [];
    while (curr !== s) {
      const edge = parentEdge.get(curr)!;
      path.push(edge);
      curr = edge.from;
    }

    const delta = Math.min(...path.map((e) => e.capacity));

    // Augment flow
    for (const edge of path) {
      if (edge.isBackward) {
        edge.originalEdge.flow -= delta;
      } else {
        edge.originalEdge.flow += delta;
      }
    }
  }

  // Check if max flow matches sumSupply
  let totalFlow = 0;
  for (const edge of auxGraph.getNeighbors(s)) {
    totalFlow += edge.flow;
  }

  if (Math.abs(totalFlow - sumSupply) > epsilon) {
    return null; // Feasible b-flow not possible
  }

  // Copy flow values back to the cloned graph
  for (const node of clone.getNodes()) {
    for (const edge of clone.getNeighbors(node)) {
      const auxEdge = auxGraph.getEdge(edge.from, edge.to);
      if (auxEdge) {
        (edge as FlowEdge<T>).flow = auxEdge.flow;
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
  if (!graph.isDirected) {
    throw new Error(
      "Cycle-Canceling algorithm strictly requires a directed graph."
    );
  }

  if (!graph.balances) {
    throw new Error(
      "Node balances are required for the Cycle-Canceling algorithm."
    );
  }

  // Copy balances map
  const balances = new Map(graph.balances);

  // Fast-fail balance check
  let sumBalances = 0;
  for (const balance of balances.values()) {
    sumBalances += balance;
  }

  if (Math.abs(sumBalances) > epsilon) {
    throw new Error(
      "No b-flow possible: Sum of the balances is not equal to 0"
    );
  }

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
    const resHighlighted = new Set<string>();
    const mainHighlighted = new Set<string>();

    if (cycleEdges) {
      for (const e of cycleEdges) {
        resHighlighted.add(`${e.from}->${e.to}`);
        mainHighlighted.add(`${e.originalEdge.from}->${e.originalEdge.to}`);
      }
    } else if (parentMap) {
      for (const [, edge] of parentMap.entries()) {
        if (edge) {
          resHighlighted.add(`${edge.from}->${edge.to}`);
        }
      }
    }

    const visualResidual = residualGraph
      ? convertToWeightedMCFResidualGraph(residualGraph, epsilon)
      : null;

    const residualVisualState = residualGraph
      ? {
          currentNode: resCurrentNode,
          visitedNodes: new Set<T>(),
          queuedNodes: new Set<T>(),
          highlightedEdges: resHighlighted,
          frontierEdges: new Set<string>(),
          evaluatingEdge: resEvaluatingEdge
            ? { from: resEvaluatingEdge.from, to: resEvaluatingEdge.to }
            : null
        }
      : null;

    return {
      currentNode: null,
      visitedNodes: new Set<T>(),
      queuedNodes: new Set<T>(),
      highlightedEdges: mainHighlighted,
      frontierEdges: new Set<string>(),
      evaluatingEdge: null,
      notes,
      graph: clone,
      totalCost,
      residualGraph: visualResidual,
      residualVisualState
    };
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

  // Phase 2: Cancel negative cost cycles
  while (true) {
    const residualGraph = createResidualGraph(clone);

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

    // Augment flow
    for (const edge of cycleEdges) {
      if (edge.isBackward) {
        (edge.originalEdge as FlowEdge<T>).flow -= gamma;
      } else {
        (edge.originalEdge as FlowEdge<T>).flow += gamma;
      }
    }

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
