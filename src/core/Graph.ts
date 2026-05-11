import type { Edge } from "./types";

export class Graph<
  T = number,
  IsDirected extends boolean = boolean,
  E extends Edge<T> = Edge<T>
> {
  private adjacencyList: Map<T, E[]> = new Map();

  public readonly isDirected: IsDirected;

  constructor(isDirected: IsDirected) {
    this.isDirected = isDirected;
  }

  /**
   * Utility to construct a Graph from an array of edges.
   */
  static fromEdges<IsDirected extends boolean, E extends Edge<any>>(
    edges: E[],
    isDirected: IsDirected
  ): Graph<E["from"], IsDirected, E> {
    const graph = new Graph<E["from"], IsDirected, E>(isDirected);
    for (const edge of edges) {
      graph.addEdge(edge);
    }
    return graph;
  }

  addNode(id: T): void {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
    }
  }

  /**
   * Adds an edge to the graph.
   */
  addEdge(edge: E): void {
    // Ensure both nodes exist
    this.addNode(edge.from);
    this.addNode(edge.to);

    // Add the forward edge
    this.adjacencyList.get(edge.from)!.push(edge);

    // If undirected, automatically add the reverse edge maintaining all properties
    if (!this.isDirected) {
      const reverseEdge: E = { ...edge, from: edge.to, to: edge.from };
      this.adjacencyList.get(edge.to)!.push(reverseEdge);
    }
  }

  /**
   * Gets the neighbors of a given node.
   */
  getNeighbors(id: T): Readonly<E>[] {
    return this.adjacencyList.get(id) || [];
  }

  getNodes(): T[] {
    return Array.from(this.adjacencyList.keys());
  }

  /**
   * Retrieves a specific edge between two nodes if it exists.
   */
  getEdge(from: T, to: T): Readonly<E> | undefined {
    const neighbors = this.adjacencyList.get(from);
    if (!neighbors) return undefined;

    return neighbors.find((e) => e.to === to);
  }
}
