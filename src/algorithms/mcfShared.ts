import { Graph } from "../core/Graph.ts";
import type { FlowEdge, WeightedEdge, ResidualEdge } from "../core/types.ts";
import type { LocalizedNote } from "../lib/localization.ts";
import { convertToWeightedMCFResidualGraph, EPSILON } from "./utils.ts";

// 1. Unified State Interface
export interface MCFStepState<T extends string | number> {
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

// 2. Shared Precondition Validator
export function validateMCFPreconditions<T extends string | number>(
  graph: Graph<T, true, FlowEdge<T>>,
  epsilon: number = EPSILON
): Map<T, number> {
  if (!graph.isDirected) {
    throw new Error("MCF algorithms strictly require a directed graph.");
  }
  if (!graph.balances) {
    throw new Error("Node balances are required for MCF algorithms.");
  }

  const balances = new Map(graph.balances);
  let sumBalances = 0;
  for (const balance of balances.values()) {
    sumBalances += balance;
  }

  if (Math.abs(sumBalances) > epsilon) {
    throw new Error(
      "No b-flow possible: Sum of the balances is not equal to 0"
    );
  }

  return balances;
}

// 3. Shared State Builder
export function buildMCFStepState<T extends string | number>(
  clone: Graph<T, true, FlowEdge<T>>,
  totalCost: number,
  notes: LocalizedNote,
  epsilon: number = EPSILON,
  residualGraph: Graph<T, true, ResidualEdge<T>> | null = null,
  resCurrentNode: T | null = null,
  resEvaluatingEdge: ResidualEdge<T> | null = null,
  resVisited: Set<T> = new Set(),
  resQueued: Set<T> = new Set(),
  highlightedResEdges: Iterable<ResidualEdge<T>> = []
): MCFStepState<T> {
  const resHighlighted = new Set<string>();
  const mainHighlighted = new Set<string>();

  for (const e of highlightedResEdges) {
    resHighlighted.add(`${e.from}->${e.to}`);
    mainHighlighted.add(`${e.originalEdge.from}->${e.originalEdge.to}`);
  }

  const visualResidual = residualGraph
    ? convertToWeightedMCFResidualGraph(residualGraph, epsilon)
    : null;

  const residualVisualState = residualGraph
    ? {
        currentNode: resCurrentNode,
        visitedNodes: resVisited,
        queuedNodes: resQueued,
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
}

export interface RelaxationStep<T> {
  u: T;
  edge: ResidualEdge<T>;
  iteration: number;
  parent: Map<T, ResidualEdge<T> | null>;
}

export function* findNegativeCycle<T extends string | number>(
  residualGraph: Graph<T, true, ResidualEdge<T>>,
  epsilon: number = EPSILON,
  recordState: boolean = true
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

            if (recordState) {
              yield { u, edge, iteration: i, parent: new Map(parent) };
            }
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
          parent.set(v, edge);
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

export function augmentFlow<T>(edges: ResidualEdge<T>[], gamma: number): void {
  for (const edge of edges) {
    if (edge.isBackward) {
      (edge.originalEdge as FlowEdge<T>).flow -= gamma;
    } else {
      (edge.originalEdge as FlowEdge<T>).flow += gamma;
    }
    edge.capacity -= gamma;
    if (edge.companion) {
      edge.companion.capacity += gamma;
    }
  }
}

export function calculateInitialPotentials<T extends string | number>(
  residualGraph: Graph<T, true, ResidualEdge<T>>,
  nodes: T[],
  epsilon: number = EPSILON
): Map<T, number> {
  const initialDist = new Map<T, number>();
  for (const node of nodes) {
    initialDist.set(node, 0);
  }

  const V = nodes.length;
  for (let i = 1; i < V; i++) {
    let relaxed = false;
    for (const u of nodes) {
      const distU = initialDist.get(u) ?? 0;
      for (const edge of residualGraph.getNeighbors(u)) {
        if (edge.capacity > epsilon) {
          const v = edge.to;
          const cost = edge.cost;
          const distV = initialDist.get(v) ?? 0;
          if (distU + cost < distV - epsilon) {
            initialDist.set(v, distU + cost);
            relaxed = true;
          }
        }
      }
    }
    if (!relaxed) break;
  }

  const potentials = new Map<T, number>();
  for (const node of nodes) {
    potentials.set(node, -(initialDist.get(node) ?? 0));
  }
  return potentials;
}

export function calculateImbalances<T>(
  graph: Graph<T, true, FlowEdge<T>>,
  initialBalances: Map<T, number>
): Map<T, number> {
  const imbalances = new Map<T, number>(initialBalances);
  for (const u of graph.getNodes()) {
    for (const edge of graph.getNeighbors(u)) {
      const flow = edge.flow;
      imbalances.set(u, (imbalances.get(u) ?? 0) - flow);
      imbalances.set(edge.to, (imbalances.get(edge.to) ?? 0) + flow);
    }
  }
  return imbalances;
}

export function buildReducedCostGraph<T extends string | number>(
  residualGraph: Graph<T, true, ResidualEdge<T>>,
  potentials: Map<T, number>,
  epsilon: number = EPSILON
): Graph<T, true, WeightedEdge<T>> {
  const wGraph = new Graph<T, true, WeightedEdge<T>>(true);
  for (const node of residualGraph.getNodes()) {
    wGraph.addNode(node);
  }
  for (const u of residualGraph.getNodes()) {
    for (const edge of residualGraph.getNeighbors(u)) {
      if (edge.capacity > epsilon) {
        const reducedCost = Math.max(
          0,
          edge.cost - (potentials.get(u) ?? 0) + (potentials.get(edge.to) ?? 0)
        );
        wGraph.addEdge({
          kind: "weighted",
          from: edge.from,
          to: edge.to,
          weight: Number(reducedCost.toFixed(5)),
          ref: edge
        } as unknown as WeightedEdge<T>);
      }
    }
  }
  return wGraph;
}
