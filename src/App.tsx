import React, { useState, useCallback } from "react";
import { Graph } from "@/core/Graph.ts";
import {
  connectedComponentsVisualizer,
  primVisualizer,
  kruskalVisualizer
} from "@/ui/adapters.ts";
import { useAlgorithmRunner } from "@/ui/hooks/useAlgorithmRunner.ts";
import { TopBar } from "@/components/TopBar.tsx";
import { GraphCanvas } from "@/components/GraphCanvas.tsx";
import { SubWindow } from "@/components/SubWindow.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

type AlgorithmOption = "CC" | "PRIM" | "KRUSKAL";

export const App: React.FC = () => {
  const [graph, setGraph] = useState<Graph<number> | null>(null);
  const [activeAlgorithm, setActiveAlgorithm] =
    useState<AlgorithmOption>("PRIM");
  const [delayMs, setDelayMs] = useState([600]);

  const algorithmFactory = useCallback(() => {
    if (!graph) return null;

    switch (activeAlgorithm) {
      case "CC":
        return connectedComponentsVisualizer(graph);
      case "PRIM":
        return primVisualizer(graph);
      case "KRUSKAL":
        return kruskalVisualizer(graph);
      default:
        return null;
    }
  }, [graph, activeAlgorithm]);

  const { visualState, isPlaying, togglePlay, stepForward, reset } =
    useAlgorithmRunner(algorithmFactory, delayMs[0]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      <TopBar
        onGraphLoaded={setGraph}
        onPlayPause={togglePlay}
        onStep={stepForward}
        onReset={reset}
        isPlaying={isPlaying}
        hasGraph={graph !== null}
      />

      {graph && (
        <div className="absolute top-20 right-4 z-10 bg-white p-4 rounded shadow border border-gray-200 flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-700 min-w-[70px]">
              Algorithm:
            </label>
            <Select
              value={activeAlgorithm}
              onValueChange={(value) =>
                setActiveAlgorithm(value as AlgorithmOption)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select an algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CC">Connected Components</SelectItem>
                <SelectItem value="PRIM">Prim's MST</SelectItem>
                <SelectItem value="KRUSKAL">Kruskal's MST</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-700 min-w-[70px]">
              Delay (ms):
            </label>
            <Slider
              value={delayMs}
              onValueChange={setDelayMs}
              max={2000}
              min={100}
              step={100}
              className="w-[180px]"
            />
          </div>
        </div>
      )}

      {/* Main Visualizer */}
      <GraphCanvas graph={graph} visualState={visualState} />

      {/* Conditionally Render SubWindow for Algorithms running Sub-Routines */}
      {graph && visualState.subVisualState && (
        <SubWindow title="Sub-Visual State">
          <GraphCanvas
            graph={visualState.subGraph || graph}
            visualState={visualState.subVisualState}
          />
        </SubWindow>
      )}
    </div>
  );
};
