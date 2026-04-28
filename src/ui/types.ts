export interface VisualState<T> {
  visitedNodes: Set<T>;
  queuedNodes: Set<T>;
  currentNode: T | null;
  highlightedEdges: Set<EdgeKey>;
  frontierEdges: Set<EdgeKey>;
  evaluatingEdge: EdgeKey | null;
}

export const INITIAL_VISUAL_STATE: VisualState<any> = {
  visitedNodes: new Set(),
  queuedNodes: new Set(),
  currentNode: null,
  highlightedEdges: new Set(),
  frontierEdges: new Set(),
  evaluatingEdge: null
};

export type EdgeKey = string & { readonly __brand: unique symbol };

export function getEdgeKey<T>(a: T, b: T): EdgeKey {
  const strA = String(a);
  const strB = String(b);
  return (strA < strB ? `${strA}-${strB}` : `${strB}-${strA}`) as EdgeKey;
}
