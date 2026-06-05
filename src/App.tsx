import React, { useState, useCallback } from "react";
import { Graph } from "@/core/Graph.ts";
import {
  connectedComponentsVisualizer,
  primVisualizer,
  kruskalVisualizer,
  doubleTreeVisualizer,
  nearestNeighborVisualizer,
  bruteForceVisualizer,
  branchAndBoundVisualizer,
  dijkstraVisualizer
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
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

type AlgorithmOption =
  | "CC"
  | "PRIM"
  | "KRUSKAL"
  | "DOUBLE_TREE"
  | "NEAREST_NEIGHBOR"
  | "BRUTE_FORCE"
  | "BRANCH_AND_BOUND"
  | "DIJKSTRA";

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
      case "DOUBLE_TREE":
        return doubleTreeVisualizer(graph);
      case "NEAREST_NEIGHBOR":
        return nearestNeighborVisualizer(graph);
      case "BRUTE_FORCE":
        return bruteForceVisualizer(graph);
      case "BRANCH_AND_BOUND":
        return branchAndBoundVisualizer(graph);
      case "DIJKSTRA":
        return dijkstraVisualizer(graph);
      default:
        return null;
    }
  }, [graph, activeAlgorithm]);

  const { visualState, isPlaying, error, togglePlay, stepForward, reset } =
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

      {/* ERROR BANNER */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg">
          <Alert
            variant="destructive"
            className="shadow-lg bg-red-50 border-red-200 relative"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Algorithm Error</AlertTitle>
            <AlertDescription className="pr-6">{error}</AlertDescription>

            <AlertAction className="top-0 flex h-full items-center">
              <Button
                onClick={reset}
                variant="destructive"
                size="icon"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}

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
                <SelectItem value="DOUBLE_TREE">Double Tree TSP</SelectItem>
                <SelectItem value="NEAREST_NEIGHBOR">
                  Nearest Neighbor TSP
                </SelectItem>
                <SelectItem value="BRUTE_FORCE">Brute-Force TSP</SelectItem>
                <SelectItem value="BRANCH_AND_BOUND">
                  Branch & Bound TSP
                </SelectItem>
                <SelectItem value="DIJKSTRA">Dijkstra Shortest Path</SelectItem>
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
