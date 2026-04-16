import type { Edge } from "./types";

export class Graph<T = number> {
  private adjacencyList: Map<T, Edge<T>[]> = new Map();
  private readonly isDirected: boolean;

  constructor(isDirected: boolean = false) {
    this.isDirected = isDirected;
  }

  addNode(id: T): void {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
    }
  }

  addEdge(from: T, edge: Edge<T>): void {
    // Ensure both nodes exist
    this.addNode(from);
    this.addNode(edge.to);

    // Add the forward edge
    this.adjacencyList.get(from)!.push(edge);

    // If undirected, automatically add the reverse edge maintaining all properties
    if (!this.isDirected) {
      const reverseEdge: Edge<T> = { ...edge, to: from };
      this.adjacencyList.get(edge.to)!.push(reverseEdge);
    }
  }

  getNeighbors(id: T): Edge<T>[] {
    return this.adjacencyList.get(id) || [];
  }

  getNodes(): T[] {
    return Array.from(this.adjacencyList.keys());
  }
}
