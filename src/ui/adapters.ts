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
import type { UnweightedEdge } from "@/core/types.ts";

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
        queuedNodes: new Set(state.bfsState.queue)
      };
    } else {
      yield {
        ...INITIAL_VISUAL_STATE,
        currentNode: state.evaluatingNode,
        visitedNodes: new Set(state.visitedNodes),
        queuedNodes: new Set()
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
      evaluatingEdge
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
      subVisualState
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
        highlightedEdges: mstEdges
      };
    } else {
      // Phase 2 & 3: Show the MST as background (frontierEdges) and the TSP Tour as highlighted
      yield {
        ...INITIAL_VISUAL_STATE,
        visitedNodes: new Set(state.tourNodes),
        currentNode: state.evaluatingNode,
        highlightedEdges: tourEdges,
        frontierEdges: mstEdges, // Keeps the underlying MST visible
        evaluatingEdge
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
      evaluatingEdge
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
        highlightedEdges: bestTourEdges
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
        frontierEdges: bestTourEdges // Ghosts the current optimal tour in the background
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
        highlightedEdges: bestTourEdges
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
        frontierEdges: bestTourEdges // Best optimal path ghosted in the background
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
      evaluatingEdge
    };
  }
}
