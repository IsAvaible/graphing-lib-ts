// T represents the type of the Node ID (e.g., number, string)
export type UnweightedEdge<T> = {
  kind: "unweighted";
  to: T;
};

export type WeightedEdge<T> = {
  kind: "weighted";
  to: T;
  weight: number;
};

export type FlowEdge<T> = {
  kind: "flow";
  to: T;
  capacity: number;
  flow: number;
  cost?: number; // For future application in Cycle-Canceling
};

// Discriminated Union
export type Edge<T> = UnweightedEdge<T> | WeightedEdge<T> | FlowEdge<T>;
