import { Graph } from "../core/Graph";
import type { WeightedEdge } from "../core/types";
import { MinPriorityQueue } from "@/algorithms/datastructures/MinPriorityQueue.ts";
import { UnionFind } from "@/algorithms/datastructures/UnionFind.ts";

/**
 * Represents a snapshot of Prim's algorithm at a specific step.
 * @template T The id-type of a vertex in the graph. Constrained to primitives for Set/Map safety.
 */
export interface PrimState<T extends string | number> {
  visitedNodes: Set<T>;
  mstEdges: WeightedEdge<T>[];
  evaluatingEdge: WeightedEdge<T> | null;
  availableEdges: WeightedEdge<T>[];
}

/**
 * Represents a snapshot of Kruskal's algorithm at a specific step.
 * @template T The id-type of a vertex in the graph. Constrained to primitives for Set/Map safety.
 */
export interface KruskalState<T extends string | number> {
  mstEdges: WeightedEdge<T>[];
  evaluatingEdge: WeightedEdge<T> | null;
  edgesProcessed: number;
  totalEdges: number;
  ufState?: {
    currentNode: T;
    activeNodes: Set<T>;
    activeEdges: { from: T; to: T }[];
  };
}

/**
 * A Generator that yields the state of Prim's Algorithm at each step.
 * Now supports disconnected graphs (forests) and utilizes a Min-Priority Queue.
 */
export function* primsAlgorithmGenerator<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>,
  startNode?: T,
  recordState: boolean = true
): Generator<PrimState<T>, WeightedEdge<T>[], unknown> {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return [];

  const visited = new Set<T>();
  const mstEdges: WeightedEdge<T>[] = [];
  const pq = new MinPriorityQueue<T>();

  // Helper to extract new weighted edges from a newly visited node
  const addEdgesFrom = (node: T) => {
    for (const edge of graph.getNeighbors(node)) {
      if (edge.kind === "weighted" && !visited.has(edge.to)) {
        pq.push({ ...edge });
      }
    }
  };

  // Reorder nodes so startNode is processed first, if provided (this will incur a O(n) penality)
  const orderedNodes =
    startNode !== undefined
      ? [startNode, ...nodes.filter((n) => n !== startNode)]
      : nodes;

  // Outer loop to handle disconnected graphs (Minimum Spanning Forest)
  for (const start of orderedNodes) {
    if (visited.has(start)) continue;

    visited.add(start);
    addEdgesFrom(start);

    while (!pq.isEmpty()) {
      const minEdge = pq.pop()!;

      // Yield the state first so the observer sees what edge is being evaluated
      if (recordState) {
        yield {
          visitedNodes: new Set(visited),
          mstEdges: [...mstEdges],
          evaluatingEdge: minEdge,
          availableEdges: pq.toArray()
        };
      }

      // Skip if this edge points back into our already-visited set
      if (visited.has(minEdge.to)) {
        continue;
      }

      visited.add(minEdge.to);
      mstEdges.push(minEdge);

      addEdgesFrom(minEdge.to);
    }
  }

  return mstEdges;
}

/**
 * A Generator that yields the state of Kruskal's Algorithm at each step.
 */
export function* kruskalsAlgorithmGenerator<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>,
  recordState: boolean = true,
  recordSubState: boolean = true
): Generator<KruskalState<T>, WeightedEdge<T>[], unknown> {
  const nodes = graph.getNodes();
  const uf = new UnionFind<T>();

  nodes.forEach((n) => uf.add(n));

  const allEdges: WeightedEdge<T>[] = [];

  // Gather all weighted edges and deduplicate
  for (const node of nodes) {
    for (const edge of graph.getNeighbors(node)) {
      if (edge.kind === "weighted") {
        // Optimization: Deduplicate edges to halve sorting workload
        if (edge.from < edge.to) {
          allEdges.push({ ...edge });
        }
      }
    }
  }
  // Sort all edges by weight globally
  allEdges.sort((a, b) => a.weight - b.weight);

  const mstEdges: WeightedEdge<T>[] = [];
  let edgesProcessed = 0;

  for (const edge of allEdges) {
    edgesProcessed++;

    if (recordState && recordSubState) {
      const unionGen = uf.unionStepGenerator(edge.from, edge.to);
      let result = unionGen.next();

      // Funnel all sub-routine updates directly to the outer observer
      while (!result.done) {
        yield {
          mstEdges: [...mstEdges],
          evaluatingEdge: edge,
          edgesProcessed,
          totalEdges: allEdges.length,
          ufState: result.value
        };
        result = unionGen.next();
      }

      // Add edge if accepted
      if (result.value) {
        mstEdges.push(edge);
      }

      // Let the evaluating edge clear visually before pulling the next edge
      yield {
        mstEdges: [...mstEdges],
        evaluatingEdge: null,
        edgesProcessed,
        totalEdges: allEdges.length
      };
    } else {
      if (recordState) {
        // Yield only the high-level Kruskal state
        yield {
          mstEdges: [...mstEdges],
          evaluatingEdge: edge,
          edgesProcessed,
          totalEdges: allEdges.length
        };
      }

      // Perform union without substate tracking
      if (uf.union(edge.from, edge.to)) {
        mstEdges.push(edge);
      }
    }
  }

  return mstEdges;
}

/**
 * Standard utility wrapper to run Prim's generator instantly.
 */
export function primsAlgorithm<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>,
  startNode?: T
): WeightedEdge<T>[] {
  const generator = primsAlgorithmGenerator(graph, startNode, false);
  let result = generator.next();

  while (!result.done) {
    result = generator.next();
  }

  return result.value;
}

/**
 * Standard utility wrapper to run Kruskal's generator instantly.
 */
export function kruskalsAlgorithm<T extends string | number>(
  graph: Graph<T, false, WeightedEdge<T>>
): WeightedEdge<T>[] {
  const generator = kruskalsAlgorithmGenerator(graph, false, false);
  let result = generator.next();

  while (!result.done) {
    result = generator.next();
  }

  return result.value;
}
