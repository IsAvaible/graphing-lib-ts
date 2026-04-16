import React, { useState, useCallback } from "react";
import { Graph } from "@/core/Graph.ts";
import { connectedComponentsVisualizer } from "@/ui/adapters.ts";
import { useAlgorithmRunner } from "@/ui/hooks/useAlgorithmRunner.ts";
import { TopBar } from "@/components/TopBar.tsx";
import { GraphCanvas } from "@/components/GraphCanvas.tsx";

export const App: React.FC = () => {
  const [graph, setGraph] = useState<Graph<number> | null>(null);

  const algorithmFactory = useCallback(() => {
    if (!graph) return null;
    return connectedComponentsVisualizer(graph);
  }, [graph]);

  const { visualState, isPlaying, togglePlay, stepForward, reset } =
    useAlgorithmRunner(algorithmFactory);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopBar
        onGraphLoaded={setGraph}
        onPlayPause={togglePlay}
        onStep={stepForward}
        onReset={reset}
        isPlaying={isPlaying}
        hasGraph={graph !== null}
      />
      <GraphCanvas
        graph={graph}
        visitedNodes={visualState.visitedNodes}
        currentNode={visualState.currentNode}
        queuedNodes={visualState.queuedNodes}
      />
    </div>
  );
};
