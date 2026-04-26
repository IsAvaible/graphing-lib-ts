// T represents the type of the Node ID (e.g., number, string)
type BaseEdge<T> = {
  from: T;
  to: T;
};

export type UnweightedEdge<T> = {
  kind: "unweighted";
} & BaseEdge<T>;

export type WeightedEdge<T> = {
  kind: "weighted";
  weight: number;
} & BaseEdge<T>;

export type FlowEdge<T> = {
  kind: "flow";
  capacity: number;
  flow: number;
  cost?: number; // For future application in Cycle-Canceling
} & BaseEdge<T>;

// Discriminated Union
export type Edge<T> = UnweightedEdge<T> | WeightedEdge<T> | FlowEdge<T>;
