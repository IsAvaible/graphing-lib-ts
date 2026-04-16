import { Graph } from "../core/Graph";

/**
 * Represents a snapshot of the Breadth-First Search (BFS) algorithm at a specific step.
 * @template T The id-type of a vertex in the graph.
 */
export interface BFSState<T> {
  currentNode: T;
  visitedNodes: Set<T>;
  queue: T[];
}

/**
 * A Generator that yields the state of the BFS at each step.
 * This can be consumed instantly for pure math, or step-by-step for visualization.
 */
export function* breadthFirstSearch<T>(
  graph: Graph<T>,
  startNode: T,
  visited: Set<T> = new Set()
): Generator<BFSState<T>, void, unknown> {
  const queue: T[] = [startNode];
  visited.add(startNode);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // YIELD the current state to external consumer.
    yield {
      currentNode: current,
      visitedNodes: new Set(visited),
      queue: [...queue]
    };

    for (const edge of graph.getNeighbors(current)) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
}

/**
 * Wraps the BFS generator to count isolated components.
 */
export function countConnectedComponents<T>(graph: Graph<T>): number {
  const visited = new Set<T>();
  let componentCount = 0;

  for (const startNode of graph.getNodes()) {
    // If we haven't seen this node, it belongs to a new component
    if (!visited.has(startNode)) {
      componentCount++;

      // Initialize the BFS generator for this component
      const bfs = breadthFirstSearch(graph, startNode, visited);

      // Consume the generator completely to traverse the entire component instantly
      for (const _step of bfs) {
      }
    }
  }

  return componentCount;
}
