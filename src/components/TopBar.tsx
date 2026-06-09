import React, { type ChangeEvent } from "react";
import { Graph } from "@/core/Graph";
import { readGraphFromFileBrowser } from "@/io/browser-reader.ts";
import { parseMixedGraph } from "@/io/parser.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  UploadIcon,
  PlayIcon,
  StepForwardIcon,
  RotateCcwIcon,
  PauseIcon
} from "lucide-react";

interface TopBarProps {
  onGraphLoaded: (graph: Graph<number>) => void;
  onPlayPause: () => void;
  onStep: () => void;
  onReset: () => void;
  isPlaying: boolean;
  hasGraph: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onGraphLoaded,
  onPlayPause,
  onStep,
  onReset,
  isPlaying,
  hasGraph
}) => {
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Read the file lines to detect if it has flow edges
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    let isDirected = false;

    if (lines.length > 1) {
      const firstEdgeLine = lines[1];
      const parts = firstEdgeLine.split(/\s+/);
      if (parts.length >= 4) {
        // 4 columns means Flow Edge. Flow graphs are directed by default.
        isDirected = true;
      }
    }

    const graph = await parseMixedGraph(
      await readGraphFromFileBrowser(file),
      isDirected
    );
    onGraphLoaded(graph);
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 shadow-sm z-10 relative bg-white">
      <h1 className="text-xl font-bold tracking-wider">SC² Graphing Library</h1>

      <div className="flex items-center gap-4">
        <Button asChild variant="outline">
          <label className="cursor-pointer flex items-center gap-2">
            <UploadIcon size={16} />
            Upload
            <input
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </Button>

        {hasGraph && (
          <div className="flex items-center gap-2 border-l pl-4 ml-2">
            <Button variant="outline" onClick={onStep} disabled={isPlaying}>
              <StepForwardIcon size={16} className="mr-2" />
              Step
            </Button>

            <Button onClick={onPlayPause}>
              {isPlaying ? (
                <PauseIcon size={16} className="mr-2" />
              ) : (
                <PlayIcon size={16} className="mr-2" />
              )}
              {isPlaying ? "Pause" : "Auto Run"}
            </Button>

            <Button variant="ghost" onClick={onReset}>
              <RotateCcwIcon size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
