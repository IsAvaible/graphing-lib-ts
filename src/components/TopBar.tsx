import React, { type ChangeEvent } from "react";
import { Graph } from "../core/Graph";
import { readGraphFromFileBrowser } from "../io/browser-reader.ts";

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
    <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white shadow-md z-10 relative">
      <h1 className="text-xl font-bold tracking-wider">SC² Graphing Library</h1>

      <div className="flex items-center gap-4">
        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
          Upload
          <input
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
        <button
          className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          onClick={() => alert("BFS Animation not implemented yet.")}
        >
          Run BFS
        </button>
      </div>
    </div>
  );
};
