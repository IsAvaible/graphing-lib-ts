import type { Edge } from "./types";

export class Graph<T = number> {
  private adjacencyList: Map<T, Edge<T>[]> = new Map();
  public readonly isDirected: boolean;

  constructor(isDirected: boolean = false) {
    this.isDirected = isDirected;
  }

  /**
   * Utility to construct a Graph from an array of edges.
   */
  static fromEdges<T = number>(
    edges: Edge<T>[],
    isDirected: boolean = false
  ): Graph<T> {
    const graph = new Graph<T>(isDirected);
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
  addEdge(edge: Edge<T>): void {
    // Ensure both nodes exist
    this.addNode(edge.from);
    this.addNode(edge.to);

    // Add the forward edge
    this.adjacencyList.get(edge.from)!.push(edge);

    // If undirected, automatically add the reverse edge maintaining all properties
    if (!this.isDirected) {
      const reverseEdge: Edge<T> = { ...edge, from: edge.to, to: edge.from };
      this.adjacencyList.get(edge.to)!.push(reverseEdge);
    }
  }

  /**
   * Gets the neighbors of a given node.
   */
  getNeighbors(id: T): Readonly<Edge<T>>[] {
    return this.adjacencyList.get(id) || [];
  }

  getNodes(): T[] {
    return Array.from(this.adjacencyList.keys());
  }

  /**
   * Retrieves a specific edge between two nodes if it exists.
   */
  getEdge(from: T, to: T): Readonly<Edge<T>> | undefined {
    const neighbors = this.adjacencyList.get(from);
    if (!neighbors) return undefined;

    return neighbors.find((e) => e.to === to);
  }
}
