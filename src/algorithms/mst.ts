import { Graph } from "../core/Graph";
import type { WeightedEdge } from "../core/types";

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
}

/**
 * Internal Min-Priority Queue for Prim's Algorithm optimization ($O(\log V)$ insertions/extractions).
 */
class MinPriorityQueue<T extends string | number> {
  private heap: WeightedEdge<T>[] = [];

  push(edge: WeightedEdge<T>): void {
    this.heap.push(edge);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): WeightedEdge<T> | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const top = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.sinkDown(0);
    return top;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Returns a shallow copy of the underlying heap array for state recording.
   */
  toArray(): WeightedEdge<T>[] {
    return [...this.heap];
  }

  private bubbleUp(index: number): void {
    let curr = index;
    while (curr > 0) {
      const parent = Math.floor((curr - 1) / 2);
      if (this.heap[curr].weight >= this.heap[parent].weight) break;
      this.swap(curr, parent);
      curr = parent;
    }
  }

  private sinkDown(index: number): void {
    let curr = index;
    const length = this.heap.length;

    while (true) {
      let left = 2 * curr + 1;
      let right = 2 * curr + 2;
      let smallest = curr;

      if (
        left < length &&
        this.heap[left].weight < this.heap[smallest].weight
      ) {
        smallest = left;
      }
      if (
        right < length &&
        this.heap[right].weight < this.heap[smallest].weight
      ) {
        smallest = right;
      }

      if (smallest === curr) break;
      this.swap(curr, smallest);
      curr = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

/**
 * Internal Union-Find (Disjoint Set) utility for Kruskal's Cycle Detection.
 */
class UnionFind<T extends string | number> {
  private parent: Map<T, T> = new Map();
  private rank: Map<T, number> = new Map(); // Optimization: Union-by-Rank

  add(element: T): void {
    if (!this.parent.has(element)) {
      this.parent.set(element, element);
      this.rank.set(element, 0);
    }
  }

  find(element: T): T {
    // Optimization: Standard recursive path compression
    const p = this.parent.get(element)!;
    if (p !== element) {
      this.parent.set(element, this.find(p));
    }
    return this.parent.get(element)!;
  }

  union(a: T, b: T): boolean {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      const rankA = this.rank.get(rootA)!;
      const rankB = this.rank.get(rootB)!;

      // Optimization: Union by rank keeps the trees balanced
      if (rankA < rankB) {
        this.parent.set(rootA, rootB);
      } else if (rankA > rankB) {
        this.parent.set(rootB, rootA);
      } else {
        this.parent.set(rootB, rootA);
        this.rank.set(rootA, rankA + 1);
      }
      return true; // Union successful (no cycle)
    }
    return false; // Cycle detected
  }
}

/**
 * A Generator that yields the state of Prim's Algorithm at each step.
 * Now supports disconnected graphs (forests) and utilizes a Min-Priority Queue.
 */
export function* primsAlgorithmGenerator<T extends string | number>(
  graph: Graph<T>,
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

  // Reorder nodes so startNode is processed first, if provided
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
  graph: Graph<T>,
  recordState: boolean = true
): Generator<KruskalState<T>, WeightedEdge<T>[], unknown> {
  const nodes = graph.getNodes();
  const uf = new UnionFind<T>();

  nodes.forEach((n) => uf.add(n));

  const allEdges: WeightedEdge<T>[] = [];

  // Gather all weighted edges and deduplicate
  for (const node of nodes) {
    for (const edge of graph.getNeighbors(node)) {
      if (edge.kind === "weighted") {
        // Optimization: Deduplicate undirected edges to halve sorting workload in undirected graphs
        if (graph.isDirected || edge.from < edge.to) {
          allEdges.push({ ...edge });
        }
      }
    }
  }

  // Kruskal's requires sorting all edges by weight globally
  allEdges.sort((a, b) => a.weight - b.weight);

  const mstEdges: WeightedEdge<T>[] = [];
  let edgesProcessed = 0;

  for (const edge of allEdges) {
    edgesProcessed++;

    if (recordState) {
      yield {
        mstEdges: [...mstEdges],
        evaluatingEdge: edge,
        edgesProcessed,
        totalEdges: allEdges.length
      };
    }

    // The Union-Find check naturally rejects cycles
    if (uf.union(edge.from, edge.to)) {
      mstEdges.push(edge);
    }
  }

  return mstEdges;
}

/**
 * Standard utility wrapper to run Prim's generator instantly.
 */
export function primsAlgorithm<T extends string | number>(
  graph: Graph<T>,
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
  graph: Graph<T>
): WeightedEdge<T>[] {
  const generator = kruskalsAlgorithmGenerator(graph, false);
  let result = generator.next();

  while (!result.done) {
    result = generator.next();
  }

  return result.value;
}
