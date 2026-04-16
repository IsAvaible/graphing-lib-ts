import React, { type ChangeEvent } from "react";
import { Graph } from "../core/Graph";
import { readGraphFromFileBrowser } from "../io/browser-reader.ts";
import { Button } from "@/components/ui/button.tsx";
import { UploadIcon } from "lucide-react";

interface TopBarProps {
  onGraphLoaded: (graph: Graph<number>) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onGraphLoaded }) => {
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const graph = await readGraphFromFileBrowser(file, false);
    onGraphLoaded(graph);
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 shadow-sm z-10 relative">
      <h1 className="text-xl font-bold tracking-wider">SC² Graphing Library</h1>

      <div className="flex items-center gap-4">
        <Button asChild variant="outline">
          <label>
            <UploadIcon />
            Upload
            <input
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </Button>

        <Button onClick={() => alert("BFS Animation not implemented yet.")}>
          Run BFS
        </Button>
      </div>
    </div>
  );
};
