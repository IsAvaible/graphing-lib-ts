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
  dijkstraVisualizer,
  flowDecompositionVisualizer,
  bellmanFordVisualizer
} from "@/ui/adapters.ts";
import { useAlgorithmRunner } from "@/ui/hooks/useAlgorithmRunner.ts";
import { TopBar } from "@/components/TopBar.tsx";
import { GraphCanvas } from "@/components/GraphCanvas.tsx";
import { SubWindow } from "@/components/SubWindow.tsx";
import { type Algorithms } from "@/ui/types.ts";
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

export const App: React.FC = () => {
  const [graph, setGraph] = useState<Graph<number> | null>(null);
  const [activeAlgorithm, setActiveAlgorithm] = useState<Algorithms>("PRIM");
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
      case "FLOW_DECOMP":
        return flowDecompositionVisualizer(graph);
      case "BELLMAN_FORD":
        return bellmanFordVisualizer(graph);
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
              onValueChange={(value) => setActiveAlgorithm(value as Algorithms)}
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
                <SelectItem value="BELLMAN_FORD">
                  Bellman-Ford Shortest Path
                </SelectItem>
                <SelectItem value="FLOW_DECOMP">
                  Flussdekomposition (Ford-Fulkerson)
                </SelectItem>
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
      <GraphCanvas
        graph={visualState.algorithmData?.graph || graph}
        visualState={visualState}
      />

      {/* ALGORITHM NOTES BOX */}
      {graph && visualState.algorithm === "FLOW_DECOMP" && (
        <div className="absolute bottom-6 left-6 z-10 w-96 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200 flex flex-col space-y-3 pointer-events-auto transition-all duration-300">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Schritt-Details
            </h3>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed min-h-[50px]">
            {visualState.algorithmData.notes}
          </div>
          {visualState.algorithmData.decomposedPaths.length > 0 && (
            <div className="flex flex-col space-y-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Zerlegte Komponenten (
                {visualState.algorithmData.decomposedPaths.length}):
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {visualState.algorithmData.decomposedPaths.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-indigo-50 border border-indigo-100 text-indigo-950 p-2 rounded-md font-medium"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.isCycle
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.isCycle ? "Kreis" : "Weg"}
                      </span>
                      <span className="truncate">
                        {item.path.join(" \u2192 ")}
                      </span>
                    </div>
                    <span className="font-bold text-indigo-700 shrink-0 pl-2">
                      Fluss: {item.flow}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Draggable SubWindows for Decomposed Components */}
      {graph &&
        visualState.algorithm === "FLOW_DECOMP" &&
        visualState.algorithmData.decomposedPaths.map((item, idx) => {
          // Cascade positions so subwindows don't stack perfectly on top of each other
          const defaultX = 20 + idx * 40;
          const defaultY = 120 + idx * 40;

          // Scale size of the subwindow based on number of distinct nodes: |nodes| * 75px
          const numNodes = new Set(item.path).size;
          const windowSize = Math.max(180, numNodes * 75);

          return (
            <SubWindow
              key={`decomp-${idx}`}
              title={`${item.isCycle ? "Kreis" : "Weg"} ${idx + 1} (Fluss: ${item.flow})`}
              defaultX={defaultX}
              defaultY={defaultY}
              defaultWidth={windowSize}
              defaultHeight={windowSize}
            >
              <GraphCanvas graph={item.graph} visualState={item.visualState} />
            </SubWindow>
          );
        })}

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
