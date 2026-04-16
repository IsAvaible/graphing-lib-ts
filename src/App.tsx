import React, { useState } from "react";
import { TopBar } from "./components/TopBar";
import { GraphCanvas } from "./components/GraphCanvas";
import { Graph } from "./core/Graph";

export const App: React.FC = () => {
  // Hold the currently loaded graph in state
  const [graph, setGraph] = useState<Graph<number> | null>(null);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopBar onGraphLoaded={setGraph} />
      <GraphCanvas graph={graph} />
    </div>
  );
};
