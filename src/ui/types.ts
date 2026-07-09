import type { Graph } from "@/core/Graph.ts";
import type { FlowEdge, WeightedEdge } from "@/core/types.ts";
import type { LocalizedNote } from "@/lib/localization.ts";

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
  | "EDMONDS_KARP"
  | "CYCLE_CANCELING"
  | "SUCCESSIVE_SHORTEST_PATH";

export interface BaseVisualState<T> {
  visitedNodes: Set<T>;
  queuedNodes: Set<T>;
  currentNode: T | null;
  highlightedEdges: Set<EdgeKey>;
  frontierEdges: Set<EdgeKey>;
  evaluatingEdge: EdgeKey | null;
  subVisualState: VisualState<T> | null; // This will be rendered in a subwindow,
  subGraph?: Graph<T> | null;
  notes?: LocalizedNote;
}

export interface FlowDecompositionVisualState<T> extends BaseVisualState<T> {
  algorithm: "FLOW_DECOMP";
  algorithmData: {
    notes?: LocalizedNote;
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
    notes?: LocalizedNote;
    maxFlow: number;
    graph: Graph<T, true, FlowEdge<T>>;
    residualGraph: Graph<T, true, WeightedEdge<T>> | null;
    residualVisualState: VisualState<T> | null;
  };
}

export interface CycleCancelingVisualState<T> extends BaseVisualState<T> {
  algorithm: "CYCLE_CANCELING";
  algorithmData: {
    notes: LocalizedNote;
    totalCost: number;
    graph: Graph<T, true, FlowEdge<T>>;
    residualGraph: Graph<T, true, WeightedEdge<T>> | null;
    residualVisualState: VisualState<T> | null;
  };
}

export interface SuccessiveShortestPathVisualState<T> extends Omit<
  CycleCancelingVisualState<T>,
  "algorithm"
> {
  algorithm: "SUCCESSIVE_SHORTEST_PATH";
}

export interface DefaultVisualState<T> extends BaseVisualState<T> {
  algorithm?: Exclude<
    Algorithms,
    | "FLOW_DECOMP"
    | "EDMONDS_KARP"
    | "CYCLE_CANCELING"
    | "SUCCESSIVE_SHORTEST_PATH"
  >;
  algorithmData?: undefined;
}

export type VisualState<T> =
  | DefaultVisualState<T>
  | FlowDecompositionVisualState<T>
  | EdmondsKarpVisualState<T>
  | CycleCancelingVisualState<T>
  | SuccessiveShortestPathVisualState<T>;

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
