// types/visualization.ts
export interface VisualState<T> {
  visitedNodes: Set<T>;
  queuedNodes: Set<T>;
  currentNode: T | null;
}

export const INITIAL_VISUAL_STATE: VisualState<any> = {
  visitedNodes: new Set(),
  queuedNodes: new Set(),
  currentNode: null
};
