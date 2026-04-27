export interface VisualState<T> {
  visitedNodes: Set<T>;
  queuedNodes: Set<T>;
  currentNode: T | null;
  mstEdges: Set<string>;
  availableEdges: Set<string>;
  evaluatingEdge: string | null;
}

export const INITIAL_VISUAL_STATE: VisualState<any> = {
  visitedNodes: new Set(),
  queuedNodes: new Set(),
  currentNode: null,
  mstEdges: new Set(),
  availableEdges: new Set(),
  evaluatingEdge: null
};

export function getEdgeKey<T>(a: T, b: T): string {
  const strA = String(a);
  const strB = String(b);
  return strA < strB ? `${strA}-${strB}` : `${strB}-${strA}`;
}
