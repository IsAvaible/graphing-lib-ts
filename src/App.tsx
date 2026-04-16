import React, { useState, useRef, useEffect, useCallback } from "react";
import { Graph } from "@/core/Graph.ts";
import {
  type ConnectedComponentsState,
  countConnectedComponentsGenerator
} from "@/algorithms/search.ts";
import { TopBar } from "@/components/TopBar.tsx";
import { GraphCanvas } from "@/components/GraphCanvas.tsx";

export const App: React.FC = () => {
  // Hold the currently loaded graph in state
  const [graph, setGraph] = useState<Graph<number> | null>(null);

  // Animation/Algorithm State
  const [visitedNodes, setVisitedNodes] = useState<Set<number>>(new Set());
  const [currentNode, setCurrentNode] = useState<number | null>(null);
  const [queuedNodes, setQueuedNodes] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);

  // References for the Generator and the Timer
  const generatorRef = useRef<Generator<
    ConnectedComponentsState<number>,
    number,
    unknown
  > | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or Reset the Generator
  const resetAlgorithm = useCallback(() => {
    if (graph) {
      generatorRef.current = countConnectedComponentsGenerator(graph);
    }
    setVisitedNodes(new Set());
    setCurrentNode(null);
    setQueuedNodes(new Set());
    setIsPlaying(false);
  }, [graph]);

  useEffect(() => {
    resetAlgorithm();
  }, [graph, resetAlgorithm]);

  // Handle new graph uploads
  const handleGraphLoaded = (newGraph: Graph<number>) => {
    setGraph(newGraph);
  };

  // Step function to consume the next yield from the generator
  const stepForward = useCallback(() => {
    if (!generatorRef.current) return;

    const result = generatorRef.current.next();

    if (result.done) {
      // Algorithm finished
      setIsPlaying(false);
      setCurrentNode(null);
      setQueuedNodes(new Set());
      return;
    }

    const state = result.value;
    setVisitedNodes(state.visitedNodes);

    // Map the nested BFS state to our visual variables if traversing a component
    if (state.bfsState) {
      setCurrentNode(state.bfsState.currentNode);
      setQueuedNodes(new Set(state.bfsState.queue));
    } else {
      // Outer loop evaluation (looking for a new component)
      setCurrentNode(state.evaluatingNode);
      setQueuedNodes(new Set());
    }
  }, []);

  // Manage the Auto-Play interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        stepForward();
      }, 600); // 600ms per step - adjust for speed
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, stepForward]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopBar
        onGraphLoaded={handleGraphLoaded}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onStep={stepForward}
        onReset={resetAlgorithm}
        isPlaying={isPlaying}
        hasGraph={graph !== null}
      />
      <GraphCanvas
        graph={graph}
        visitedNodes={visitedNodes}
        currentNode={currentNode}
        queuedNodes={queuedNodes}
      />
    </div>
  );
};
