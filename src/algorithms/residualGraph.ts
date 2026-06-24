import { Graph } from "../core/Graph.ts";
import type { FlowEdge, ResidualEdge } from "../core/types.ts";

/**
 * Creates a residual graph representation from a directed flow graph.
 * @param graph The original flow graph
 */
export function createResidualGraph<T extends string | number>(
  graph: Graph<T, true, FlowEdge<T>>
): Graph<T, true, ResidualEdge<T>> {
  const residualGraph = new Graph<T, true, ResidualEdge<T>>(true);

  for (const node of graph.getNodes()) {
    residualGraph.addNode(node);
  }

  for (const node of graph.getNodes()) {
    for (const edge of graph.getNeighbors(node)) {
      if (edge.kind !== "flow") continue;

      const { from, to, capacity, flow, cost = 0 } = edge;
      const forwardCapacity = capacity - flow;
      const backwardCapacity = flow;

      const forwardEdge: ResidualEdge<T> = {
        kind: "residual",
        from,
        to,
        capacity: forwardCapacity,
        flow: 0,
        cost: cost, // Keep original cost
        isBackward: false,
        originalEdge: edge
      };

      const backwardEdge: ResidualEdge<T> = {
        kind: "residual",
        from: to,
        to: from,
        capacity: backwardCapacity,
        flow: 0,
        cost: -cost,
        isBackward: true,
        originalEdge: edge
      };

      // Set companion references for O(1) residual updates
      forwardEdge.companion = backwardEdge;
      backwardEdge.companion = forwardEdge;

      residualGraph.addEdge(forwardEdge);
      residualGraph.addEdge(backwardEdge);
    }
  }

  return residualGraph;
}
