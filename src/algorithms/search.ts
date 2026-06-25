import { Graph } from "../core/Graph";
import { runGenerator } from "./utils";
import type { LocalizedNote } from "../lib/localization.ts";

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
 * Represents a snapshot of the Depth-First Search (DFS) algorithm at a specific step.
 * @template T The id-type of a vertex in the graph.
 */
export interface DFSState<T> {
  currentNode: T;
  visitedNodes: Set<T>;
  stack: T[];
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
  notes?: LocalizedNote;
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
): Generator<BFSState<T>, Set<T>, unknown> {
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

  // Return the final data structure
  return visited;
}

/**
 * A Generator that yields the state of the DFS at each step.
 * This can be consumed instantly for pure math, or step-by-step for visualization.
 */
export function* depthFirstSearch<T>(
  graph: Graph<T>,
  startNode: T,
  visited: Set<T> = new Set(),
  recordState: boolean = true
): Generator<DFSState<T>, Set<T>, unknown> {
  const stack: T[] = [startNode];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (!visited.has(current)) {
      visited.add(current);

      if (recordState) {
        yield {
          currentNode: current,
          visitedNodes: new Set(visited),
          stack: [...stack]
        };
      }

      // Reverse loop to maintain standard left-to-right processing order
      const neighbors = graph.getNeighbors(current);
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const next = neighbors[i].to;
        if (!visited.has(next)) {
          stack.push(next);
        }
      }
    }
  }

  // Return the final data structure
  return visited;
}

/**
 * A Generator that yields the state of the Connected Components algorithm at each step,
 * including the nested BFS traversal steps.
 */
export function* countConnectedComponentsGenerator<T>(
  graph: Graph<T, false>,
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
        evaluatingNode: startNode,
        notes: {
          key: "cc.start_component",
          params: { node: startNode, count: componentCount + 1 }
        }
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
        bfsState: step,
        notes: {
          key: "cc.traverse_bfs",
          params: {
            count: componentCount,
            currentNode: step.currentNode,
            queue: step.queue
          }
        }
      };
    }
  }

  // Return the final count when the generator is exhausted
  return componentCount;
}

/**
 * Standard utility wrapper to run the generator instantly and just return the count.
 */
export function countConnectedComponents<T>(graph: Graph<T, false>): number {
  return runGenerator(countConnectedComponentsGenerator(graph, false));
}
