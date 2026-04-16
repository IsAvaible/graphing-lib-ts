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
 * Represents a snapshot of the Connected Components algorithm.
 * @template T The id-type of a vertex in the graph.
 */
export interface ConnectedComponentsState<T> {
  componentCount: number;
  visitedNodes: Set<T>;
  evaluatingNode: T;
  /** If currently traversing a new component, the nested BFS state is provided here. */
  bfsState?: BFSState<T>;
}

/**
 * A Generator that yields the state of the BFS at each step.
 * This can be consumed instantly for pure math, or step-by-step for visualization.
 */
export function* breadthFirstSearch<T>(
  graph: Graph<T>,
  startNode: T,
  visited: Set<T> = new Set(),
  recordState: boolean = true
): Generator<BFSState<T>, void, unknown> {
  const queue: T[] = [startNode];
  let head = 0;
  visited.add(startNode);

  while (head < queue.length) {
    const current = queue[head++];

    if (recordState) {
      // YIELD the current state to external consumer.
      yield {
        currentNode: current,
        visitedNodes: new Set(visited),
        queue: queue.slice(head)
      };
    }

    for (const edge of graph.getNeighbors(current)) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
}

/**
 * A Generator that yields the state of the Connected Components algorithm at each step,
 * including the nested BFS traversal steps.
 */
export function* countConnectedComponentsGenerator<T>(
  graph: Graph<T>,
  recordState: boolean = true
): Generator<ConnectedComponentsState<T>, number, unknown> {
  const visited = new Set<T>();
  let componentCount = 0;

  for (const startNode of graph.getNodes()) {
    // Skip already visited nodes
    if (visited.has(startNode)) {
      continue;
    }

    if (recordState) {
      // YIELD the outer loop state
      yield {
        componentCount,
        visitedNodes: new Set(visited),
        evaluatingNode: startNode
      };
    }

    componentCount++;

    // Initialize the BFS generator for this component
    const bfs = breadthFirstSearch(graph, startNode, visited, recordState);

    // Consume and YIELD the inner BFS steps so the visualization can animate the traversal
    for (const step of bfs) {
      yield {
        componentCount,
        visitedNodes: new Set(visited),
        evaluatingNode: startNode,
        bfsState: step
      };
    }
  }

  // Return the final count when the generator is exhausted
  return componentCount;
}

/**
 * Standard utility wrapper to run the generator instantly and just return the count.
 */
export function countConnectedComponents<T>(graph: Graph<T>): number {
  const generator = countConnectedComponentsGenerator(graph, false);
  let result = generator.next();

  if (!result.done) {
    throw new Error(
      "Generator should have been exhausted since recordState is false."
    );
  }

  // The final return value of the generator is the component count
  return result.value;
}
