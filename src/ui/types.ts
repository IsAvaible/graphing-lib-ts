import type { Graph } from "@/core/Graph.ts";
import type { FlowEdge, WeightedEdge } from "@/core/types.ts";

export type Algorithms =
  | "CC"
  | "PRIM"
  | "KRUSKAL"
  | "DOUBLE_TREE"
  | "NEAREST_NEIGHBOR"
  | "BRUTE_FORCE"
  | "BRANCH_AND_BOUND"
  | "DIJKSTRA"
  | "FLOW_DECOMP"
  | "BELLMAN_FORD"
  | "EDMONDS_KARP";

export interface BaseVisualState<T> {
  visitedNodes: Set<T>;
  queuedNodes: Set<T>;
  currentNode: T | null;
  highlightedEdges: Set<EdgeKey>;
  frontierEdges: Set<EdgeKey>;
  evaluatingEdge: EdgeKey | null;
  subVisualState: VisualState<T> | null; // This will be rendered in a subwindow,
  subGraph?: Graph<T> | null;
}

export interface FlowDecompositionVisualState<T> extends BaseVisualState<T> {
  algorithm: "FLOW_DECOMP";
  algorithmData: {
    notes: string;
    graph: Graph<T, true, FlowEdge<T>>;
    decomposedPaths: {
      path: T[];
      flow: number;
      isCycle: boolean;
      graph: Graph<T, true, FlowEdge<T>>;
      visualState: VisualState<T>;
    }[];
  };
}

export interface EdmondsKarpVisualState<T> extends BaseVisualState<T> {
  algorithm: "EDMONDS_KARP";
  algorithmData: {
    notes: string;
    maxFlow: number;
    graph: Graph<T, true, FlowEdge<T>>;
    residualGraph: Graph<T, true, WeightedEdge<T>> | null;
    residualVisualState: VisualState<T> | null;
  };
}

export interface DefaultVisualState<T> extends BaseVisualState<T> {
  algorithm?: Exclude<Algorithms, "FLOW_DECOMP" | "EDMONDS_KARP">;
  algorithmData?: undefined;
}

export type VisualState<T> =
  | DefaultVisualState<T>
  | FlowDecompositionVisualState<T>
  | EdmondsKarpVisualState<T>;

export const INITIAL_VISUAL_STATE: DefaultVisualState<any> = {
  visitedNodes: new Set(),
  queuedNodes: new Set(),
  currentNode: null,
  highlightedEdges: new Set(),
  frontierEdges: new Set(),
  evaluatingEdge: null,
  subVisualState: null,
  subGraph: null
};

export type EdgeKey = string & { readonly __brand: unique symbol };

export function getEdgeKey<T>(a: T, b: T): EdgeKey {
  const strA = String(a);
  const strB = String(b);
  return (strA < strB ? `${strA}-${strB}` : `${strB}-${strA}`) as EdgeKey;
}
