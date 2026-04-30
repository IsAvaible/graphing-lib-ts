import type { WeightedEdge } from "@/core/types.ts";

/**
 * Internal Min-Priority Queue for Prim's Algorithm optimization (O(log E) insertions/extractions).
 */
export class MinPriorityQueue<T extends string | number> {
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
