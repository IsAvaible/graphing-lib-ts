/**
 * Internal Union-Find (Disjoint Set) utility for Kruskal's Cycle Detection.
 */
export class UnionFind<T extends string | number> {
  private parent: Map<T, T> = new Map();
  private rank: Map<T, number> = new Map(); // Optimization: Union-by-Rank

  /**
   * Initializes a new disjoint set for a given element.
   */
  add(element: T): void {
    if (!this.parent.has(element)) {
      this.parent.set(element, element);
      this.rank.set(element, 0);
    }
  }

  /**
   * Finds the root of the element's set.
   * Mutates the tree by applying standard recursive path compression.
   */
  find(element: T): T {
    // Optimization: Standard recursive path compression
    const p = this.parent.get(element)!;
    if (p !== element) {
      this.parent.set(element, this.find(p));
    }
    return this.parent.get(element)!;
  }

  /**
   * Unites the sets containing 'a' and 'b'.
   * Returns true if a merge occurred, false if they were already in the same set (a cycle).
   */
  union(a: T, b: T): boolean {
    const rootA = this.find(a);
    const rootB = this.find(b);

    if (rootA !== rootB) {
      this.linkRoots(rootA, rootB);
      return true; // Union successful (no cycle)
    }
    return false; // Cycle detected
  }

  /**
   * Helper method to link two roots using union-by-rank to keep the tree shallow.
   */
  private linkRoots(rootA: T, rootB: T): void {
    const rankA = this.rank.get(rootA)!;
    const rankB = this.rank.get(rootB)!;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
  }

  /// Generator Helpers
  /**
   * Finds the root WITHOUT path compression (for yield purposes).
   */
  private peekRoot(element: T): T {
    let curr = element;
    while (curr !== this.parent.get(curr)!) curr = this.parent.get(curr)!;
    return curr;
  }

  /**
   * Retrieves all nodes belonging to the same component as the target element.
   */
  private getComponentNodes(element: T): T[] {
    const targetRoot = this.peekRoot(element);
    const nodes: T[] = [];
    for (const [node] of this.parent) {
      if (this.peekRoot(node) === targetRoot) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  /**
   * Extracts the current parent-child relationships (edges) for a specific subset of nodes.
   */
  private getActiveEdges(activeNodes: Set<T>): { from: T; to: T }[] {
    const edges: { from: T; to: T }[] = [];
    for (const node of activeNodes) {
      const p = this.parent.get(node)!;
      if (node !== p) edges.push({ from: node, to: p });
    }
    return edges;
  }

  /// Generators
  /**
   * Yields step-by-step states while traveling up the tree and performing path compression.
   */
  *findStepGenerator(
    element: T,
    activeNodes: Set<T>
  ): Generator<
    { currentNode: T; activeNodes: Set<T>; activeEdges: { from: T; to: T }[] },
    T,
    unknown
  > {
    let curr = element;
    const path: T[] = [];

    // Traverse up the tree to find the root, tracking the path.
    while (curr !== this.parent.get(curr)!) {
      path.push(curr);
      yield {
        currentNode: curr,
        activeNodes,
        activeEdges: this.getActiveEdges(activeNodes)
      };
      curr = this.parent.get(curr)!;
    }

    // Arrived at the root.
    yield {
      currentNode: curr,
      activeNodes,
      activeEdges: this.getActiveEdges(activeNodes)
    };

    // Iterative path compression. Point all nodes in the traversed path directly to the root.
    if (path.length > 0) {
      for (const node of path) this.parent.set(node, curr);
      yield {
        currentNode: curr,
        activeNodes,
        activeEdges: this.getActiveEdges(activeNodes)
      };
    }

    return curr;
  }

  /**
   * Yields step-by-step states for a union operation.
   */
  *unionStepGenerator(
    a: T,
    b: T
  ): Generator<
    { currentNode: T; activeNodes: Set<T>; activeEdges: { from: T; to: T }[] },
    boolean,
    unknown
  > {
    const activeNodes = new Set([
      ...this.getComponentNodes(a),
      ...this.getComponentNodes(b)
    ]);

    // Bubble up sub-yields
    const rootA = yield* this.findStepGenerator(a, activeNodes);
    const rootB = yield* this.findStepGenerator(b, activeNodes);

    if (rootA !== rootB) {
      this.linkRoots(rootA, rootB);

      // Determine which root became the final parent to highlight it.
      const finalRoot = this.parent.get(rootA) === rootB ? rootB : rootA;
      yield {
        currentNode: finalRoot,
        activeNodes,
        activeEdges: this.getActiveEdges(activeNodes)
      };
      return true; // Successfully merged
    }

    return false; // Cycle detected
  }
}
