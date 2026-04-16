import { Graph } from "../core/Graph";
import { countConnectedComponentsGenerator } from "@/algorithms/search.ts";
import { type VisualState } from "@/ui/types.ts";

export function* connectedComponentsVisualizer<T>(
  graph: Graph<T>
): Generator<VisualState<T>, void, unknown> {
  const algorithm = countConnectedComponentsGenerator(graph);

  for (const state of algorithm) {
    if (state.bfsState) {
      // Mapping inner BFS traversal to visual state
      yield {
        currentNode: state.bfsState.currentNode,
        visitedNodes: new Set(state.visitedNodes),
        queuedNodes: new Set(state.bfsState.queue)
      };
    } else {
      // Mapping outer loop evaluation to visual state
      yield {
        currentNode: state.evaluatingNode,
        visitedNodes: new Set(state.visitedNodes),
        queuedNodes: new Set()
      };
    }
  }
}
