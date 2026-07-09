import { Graph } from "../core/Graph";
import { countConnectedComponentsGenerator } from "@/algorithms/search.ts";
import {
  primsAlgorithmGenerator,
  kruskalsAlgorithmGenerator
} from "@/algorithms/mst.ts";
import {
  type VisualState,
  INITIAL_VISUAL_STATE,
  getEdgeKey,
  type EdgeKey
} from "@/ui/types.ts";
import { doubleTreeAlgorithmGenerator } from "@/algorithms/tsp/doubleTreeTsp.ts";
import { nearestNeighborTspGenerator } from "@/algorithms/tsp/nearestNeighborTsp.ts";
import { bruteForceTspGenerator } from "@/algorithms/tsp/bruteForceTsp.ts";
import { branchAndBoundTspGenerator } from "@/algorithms/tsp/branchAndBoundTsp.ts";
import { dijkstraGenerator } from "@/algorithms/sssp/dijkstra.ts";
import { flowDecompositionGenerator } from "@/algorithms/flowDecomposition.ts";
import { bellmanFordGenerator } from "@/algorithms/sssp/bellmanFord.ts";
import {
  edmondsKarpGenerator,
  convertToFlowGraph
} from "@/algorithms/edmondsKarp.ts";
import { cycleCancelingGenerator } from "@/algorithms/cycleCanceling.ts";
import type { UnweightedEdge, FlowEdge, WeightedEdge } from "@/core/types.ts";

export function* connectedComponentsVisualizer<T>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const algorithm = countConnectedComponentsGenerator(graph);

  for (const state of algorithm) {
    if (state.bfsState) {
      yield {
        ...INITIAL_VISUAL_STATE,
        currentNode: state.bfsState.currentNode,
        visitedNodes: new Set(state.visitedNodes),
        queuedNodes: new Set(state.bfsState.queue),
        notes: state.notes
      };
    } else {
      yield {
        ...INITIAL_VISUAL_STATE,
        currentNode: state.evaluatingNode,
        visitedNodes: new Set(state.visitedNodes),
        queuedNodes: new Set(),
        notes: state.notes
      };
    }
  }
}

export function* primVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const algorithm = primsAlgorithmGenerator(graph);

  for (const state of algorithm) {
    const mstEdges = new Set(
      state.mstEdges.map((e) => getEdgeKey(e.from, e.to))
    );
    const availableEdges = new Set(
      state.availableEdges.map((e) => getEdgeKey(e.from, e.to))
    );
    const evaluatingEdge = state.evaluatingEdge
      ? getEdgeKey(state.evaluatingEdge.from, state.evaluatingEdge.to)
      : null;

    yield {
      ...INITIAL_VISUAL_STATE,
      visitedNodes: new Set(state.visitedNodes),
      // Set the current node to the one we're evaluating the edge towards
      currentNode: state.evaluatingEdge ? state.evaluatingEdge.to : null,
      highlightedEdges: mstEdges,
      frontierEdges: availableEdges,
      evaluatingEdge,
      notes: state.notes
    };
  }
}

export function* kruskalVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const algorithm = kruskalsAlgorithmGenerator(graph);

  // Cache the subGraph object to prevent D3 from re-rendering layout coordinates
  let lastSubGraph: Graph<T, false, UnweightedEdge<T>> | undefined;

  for (const state of algorithm) {
    const mstEdges = new Set(
      state.mstEdges.map((e) => getEdgeKey(e.from, e.to))
    );
    const evaluatingEdge = state.evaluatingEdge
      ? getEdgeKey(state.evaluatingEdge.from, state.evaluatingEdge.to)
      : null;

    const visitedNodes = new Set<T>();
    for (const e of state.mstEdges) {
      visitedNodes.add(e.from);
      visitedNodes.add(e.to);
    }

    let subGraph = lastSubGraph;
    let subVisualState: VisualState<T> | null = null;

    if (state.ufState) {
      subGraph = new Graph<T, false, UnweightedEdge<T>>(false);
      state.ufState.activeNodes.forEach((n) => subGraph!.addNode(n));
      state.ufState.activeEdges.forEach((edge) => {
        subGraph!.addEdge({ ...edge, kind: "unweighted" });
      });

      subVisualState = {
        ...INITIAL_VISUAL_STATE,
        currentNode: state.ufState.currentNode
      };
    } else {
      subGraph = undefined;
    }

    yield {
      ...INITIAL_VISUAL_STATE,
      visitedNodes,
      highlightedEdges: mstEdges,
      evaluatingEdge,
      subGraph,
      subVisualState,
      notes: state.notes
    };
  }
}

export function* doubleTreeVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const algorithm = doubleTreeAlgorithmGenerator(graph);

  for (const state of algorithm) {
    const mstEdges = new Set(
      state.mstEdges.map((e) => getEdgeKey(e.from, e.to))
    );
    const tourEdges = new Set(
      state.tourEdges.map((e) => getEdgeKey(e.from, e.to))
    );
    const evaluatingEdge = state.evaluatingEdge
      ? getEdgeKey(state.evaluatingEdge.from, state.evaluatingEdge.to)
      : null;

    if (state.phase === "mst") {
      // Phase 1: Just show the MST being completed
      const visitedNodes = new Set<T>();
      state.mstEdges.forEach((e) => {
        visitedNodes.add(e.from);
        visitedNodes.add(e.to);
      });

      yield {
        ...INITIAL_VISUAL_STATE,
        visitedNodes,
        highlightedEdges: mstEdges,
        notes: state.notes
      };
    } else {
      // Phase 2 & 3: Show the MST as background (frontierEdges) and the TSP Tour as highlighted
      yield {
        ...INITIAL_VISUAL_STATE,
        visitedNodes: new Set(state.tourNodes),
        currentNode: state.evaluatingNode,
        highlightedEdges: tourEdges,
        frontierEdges: mstEdges, // Keeps the underlying MST visible
        evaluatingEdge,
        notes: state.notes
      };
    }
  }
}

export function* nearestNeighborVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const algorithm = nearestNeighborTspGenerator(graph);

  for (const state of algorithm) {
    const tourEdges = new Set(
      state.tourEdges.map((e) => getEdgeKey(e.from, e.to))
    );
    const evaluatingEdge = state.evaluatingEdge
      ? getEdgeKey(state.evaluatingEdge.from, state.evaluatingEdge.to)
      : null;

    yield {
      ...INITIAL_VISUAL_STATE,
      visitedNodes: new Set(state.tourNodes),
      currentNode: state.evaluatingNode,
      highlightedEdges: tourEdges,
      evaluatingEdge,
      notes: state.notes
    };
  }
}

export function* bruteForceVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const algorithm = bruteForceTspGenerator(graph);

  for (const state of algorithm) {
    if (state.phase === "complete") {
      const bestTourEdges = new Set(
        (state.bestTourEdges || []).map((e) => getEdgeKey(e.from, e.to))
      );

      yield {
        ...INITIAL_VISUAL_STATE,
        visitedNodes: new Set(state.bestTourNodes || []),
        highlightedEdges: bestTourEdges,
        notes: state.notes
      };
    } else {
      const currentTourEdges = new Set(
        state.currentTourEdges.map((e) => getEdgeKey(e.from, e.to))
      );
      const bestTourEdges = new Set(
        (state.bestTourEdges || []).map((e) => getEdgeKey(e.from, e.to))
      );
      const currentNode =
        state.currentTourNodes.length > 0
          ? state.currentTourNodes[state.currentTourNodes.length - 1]
          : null;

      yield {
        ...INITIAL_VISUAL_STATE,
        visitedNodes: new Set(state.currentTourNodes),
        currentNode,
        highlightedEdges: currentTourEdges,
        frontierEdges: bestTourEdges, // Ghosts the current optimal tour in the background
        notes: state.notes
      };
    }
  }
}

export function* branchAndBoundVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const algorithm = branchAndBoundTspGenerator(graph);

  for (const state of algorithm) {
    if (state.phase === "complete") {
      const bestTourEdges = new Set(
        (state.bestTourEdges || []).map((e) => getEdgeKey(e.from, e.to))
      );

      yield {
        ...INITIAL_VISUAL_STATE,
        visitedNodes: new Set(state.bestTourNodes || []),
        highlightedEdges: bestTourEdges,
        notes: state.notes
      };
    } else {
      const currentTourEdges = new Set(
        state.currentTourEdges.map((e) => getEdgeKey(e.from, e.to))
      );
      const bestTourEdges = new Set(
        (state.bestTourEdges || []).map((e) => getEdgeKey(e.from, e.to))
      );
      const currentNode =
        state.currentTourNodes.length > 0
          ? state.currentTourNodes[state.currentTourNodes.length - 1]
          : null;

      yield {
        ...INITIAL_VISUAL_STATE,
        visitedNodes: new Set(state.currentTourNodes),
        currentNode,
        highlightedEdges: currentTourEdges,
        frontierEdges: bestTourEdges, // Best optimal path ghosted in the background
        notes: state.notes
      };
    }
  }
}

export function* dijkstraVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return;
  const startNode = nodes[0];

  const algorithm = dijkstraGenerator(graph as any, startNode);

  for (const state of algorithm) {
    const highlightedEdges = new Set<EdgeKey>();
    for (const [node, pred] of state.predecessors.entries()) {
      if (pred !== null) {
        highlightedEdges.add(getEdgeKey(node, pred));
      }
    }

    const queuedNodes = new Set(state.queue.map((q) => q.node));
    const evaluatingEdge = state.evaluatingEdge
      ? getEdgeKey(state.evaluatingEdge.from, state.evaluatingEdge.to)
      : null;

    yield {
      ...INITIAL_VISUAL_STATE,
      currentNode: state.currentNode,
      visitedNodes: new Set(state.visitedNodes),
      queuedNodes,
      highlightedEdges,
      evaluatingEdge,
      notes: state.notes
    };
  }
}

export function* flowDecompositionVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const algorithm = flowDecompositionGenerator(graph);

  for (const state of algorithm) {
    const highlightedEdges = new Set<EdgeKey>();
    for (const key of state.highlightedEdges) {
      const [from, to] = key.split("->");
      highlightedEdges.add(getEdgeKey(from as any as T, to as any as T));
    }

    const frontierEdges = new Set<EdgeKey>();
    for (const key of state.frontierEdges) {
      const [from, to] = key.split("->");
      frontierEdges.add(getEdgeKey(from as any as T, to as any as T));
    }

    const evaluatingEdge = state.evaluatingEdge
      ? getEdgeKey(state.evaluatingEdge.from, state.evaluatingEdge.to)
      : null;

    // Pre-construct subgraphs and visual states to avoid doing this in React's render loop
    const decomposedPaths = state.decomposedPaths.map((item) => {
      const sub = new Graph<T, true, FlowEdge<T>>(true);
      item.path.forEach((node) => sub.addNode(node));
      for (let i = 0; i < item.path.length - 1; i++) {
        sub.addEdge({
          kind: "flow",
          from: item.path[i],
          to: item.path[i + 1],
          flow: item.flow,
          capacity: item.flow
        });
      }

      const subVis: VisualState<T> = {
        ...INITIAL_VISUAL_STATE,
        visitedNodes: new Set(item.path),
        highlightedEdges: new Set(
          item.path
            .slice(0, -1)
            .map((node, i) => getEdgeKey(node, item.path[i + 1]))
        )
      };

      return {
        path: item.path,
        flow: item.flow,
        isCycle: item.isCycle,
        graph: sub,
        visualState: subVis
      };
    });

    yield {
      visitedNodes: new Set(state.visitedNodes),
      queuedNodes: new Set(state.queuedNodes),
      currentNode: state.currentNode,
      highlightedEdges,
      frontierEdges,
      evaluatingEdge,
      subVisualState: null,
      subGraph: null,
      notes: state.notes,
      algorithm: "FLOW_DECOMP",
      algorithmData: {
        notes: state.notes,
        graph: state.graph,
        decomposedPaths
      }
    };
  }
}

export function* bellmanFordVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return;
  const startNode = nodes[0];

  const algorithm = bellmanFordGenerator(graph as any, startNode);

  for (const state of algorithm) {
    const highlightedEdges = new Set<EdgeKey>();
    for (const [node, pred] of state.predecessors.entries()) {
      if (pred !== null) {
        highlightedEdges.add(getEdgeKey(node, pred));
      }
    }

    // Mark nodes with finite distances as "visited" (indigo)
    const visitedNodes = new Set<T>();
    for (const [node, dist] of state.distances.entries()) {
      if (dist !== Infinity) {
        visitedNodes.add(node);
      }
    }

    const evaluatingEdge = state.evaluatingEdge
      ? getEdgeKey(state.evaluatingEdge.from, state.evaluatingEdge.to)
      : null;

    yield {
      ...INITIAL_VISUAL_STATE,
      currentNode: state.currentNode,
      visitedNodes,
      highlightedEdges,
      evaluatingEdge,
      notes: state.notes
    };
  }
}

export function* edmondsKarpVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  let flowGraph: Graph<T, true, FlowEdge<T>>;

  let hasFlowEdges = false;
  for (const node of graph.getNodes()) {
    for (const edge of graph.getNeighbors(node)) {
      if (edge.kind === "flow") {
        hasFlowEdges = true;
        break;
      }
    }
    if (hasFlowEdges) break;
  }

  if (hasFlowEdges) {
    flowGraph = graph as typeof flowGraph;
  } else {
    flowGraph = convertToFlowGraph(graph as Graph<T, boolean, WeightedEdge<T>>);
  }

  const algorithm = edmondsKarpGenerator(flowGraph);

  for (const state of algorithm) {
    // Map main graph highlighted edges
    const highlightedEdges = new Set<EdgeKey>();
    for (const key of state.highlightedEdges) {
      const [from, to] = key.split("->");
      highlightedEdges.add(getEdgeKey(from, to));
    }

    const frontierEdges = new Set<EdgeKey>();
    for (const key of state.frontierEdges) {
      const [from, to] = key.split("->");
      frontierEdges.add(getEdgeKey(from, to));
    }

    const evaluatingEdge = state.evaluatingEdge
      ? getEdgeKey(state.evaluatingEdge.from, state.evaluatingEdge.to)
      : null;

    // Map residual graph's visual state
    let residualVisualState: VisualState<T> | null = null;
    if (state.residualVisualState) {
      const resHighlighted = new Set<EdgeKey>();
      for (const key of state.residualVisualState.highlightedEdges) {
        const [from, to] = key.split("->");
        resHighlighted.add(getEdgeKey(from, to));
      }

      const resEvaluating = state.residualVisualState.evaluatingEdge
        ? getEdgeKey(
            state.residualVisualState.evaluatingEdge.from,
            state.residualVisualState.evaluatingEdge.to
          )
        : null;

      residualVisualState = {
        ...INITIAL_VISUAL_STATE,
        currentNode: state.residualVisualState.currentNode,
        visitedNodes: new Set(state.residualVisualState.visitedNodes),
        queuedNodes: new Set(state.residualVisualState.queuedNodes),
        highlightedEdges: resHighlighted,
        evaluatingEdge: resEvaluating
      };
    }

    yield {
      visitedNodes: new Set(state.visitedNodes),
      queuedNodes: new Set(state.queuedNodes),
      currentNode: state.currentNode,
      highlightedEdges,
      frontierEdges,
      evaluatingEdge,
      subVisualState: null,
      subGraph: null,
      notes: state.notes,
      algorithm: "EDMONDS_KARP",
      algorithmData: {
        notes: state.notes,
        maxFlow: state.maxFlow,
        graph: state.graph,
        residualGraph: state.residualGraph,
        residualVisualState
      }
    };
  }
}

export function* cycleCancelingVisualizer<T extends string | number>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  let flowGraph: Graph<T, true, FlowEdge<T>>;

  let hasFlowEdges = false;
  for (const node of graph.getNodes()) {
    for (const edge of graph.getNeighbors(node)) {
      if (edge.kind === "flow") {
        hasFlowEdges = true;
        break;
      }
    }
    if (hasFlowEdges) break;
  }

  if (hasFlowEdges) {
    flowGraph = graph as typeof flowGraph;
  } else {
    flowGraph = convertToFlowGraph(graph as Graph<T, boolean, WeightedEdge<T>>);
  }

  // Preserve balances map if present in the uploaded graph
  if (graph.balances) {
    flowGraph.balances = graph.balances;
  }

  const algorithm = cycleCancelingGenerator(flowGraph);

  for (const state of algorithm) {
    // Map main graph highlighted edges
    const highlightedEdges = new Set<EdgeKey>();
    for (const key of state.highlightedEdges) {
      const [from, to] = key.split("->");
      highlightedEdges.add(getEdgeKey(from, to));
    }

    const frontierEdges = new Set<EdgeKey>();
    for (const key of state.frontierEdges) {
      const [from, to] = key.split("->");
      frontierEdges.add(getEdgeKey(from, to));
    }

    const evaluatingEdge = state.evaluatingEdge
      ? getEdgeKey(state.evaluatingEdge.from, state.evaluatingEdge.to)
      : null;

    // Map residual graph's visual state
    let residualVisualState: VisualState<T> | null = null;
    if (state.residualVisualState) {
      const resHighlighted = new Set<EdgeKey>();
      for (const key of state.residualVisualState.highlightedEdges) {
        const [from, to] = key.split("->");
        resHighlighted.add(getEdgeKey(from, to));
      }

      const resEvaluating = state.residualVisualState.evaluatingEdge
        ? getEdgeKey(
            state.residualVisualState.evaluatingEdge.from,
            state.residualVisualState.evaluatingEdge.to
          )
        : null;

      residualVisualState = {
        ...INITIAL_VISUAL_STATE,
        currentNode: state.residualVisualState.currentNode,
        visitedNodes: new Set(state.residualVisualState.visitedNodes),
        queuedNodes: new Set(state.residualVisualState.queuedNodes),
        highlightedEdges: resHighlighted,
        evaluatingEdge: resEvaluating
      };
    }

    yield {
      visitedNodes: new Set(state.visitedNodes),
      queuedNodes: new Set(state.queuedNodes),
      currentNode: state.currentNode,
      highlightedEdges,
      frontierEdges,
      evaluatingEdge,
      subVisualState: null,
      subGraph: null,
      algorithm: "CYCLE_CANCELING",
      algorithmData: {
        notes: state.notes,
        totalCost: state.totalCost,
        graph: state.graph,
        residualGraph: state.residualGraph,
        residualVisualState
      }
    };
  }
}
