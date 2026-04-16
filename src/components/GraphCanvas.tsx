import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Graph } from "../core/Graph";

interface GraphCanvasProps {
  graph: Graph<number> | null;
  visitedNodes?: Set<number>;
  currentNode?: number | null;
  queuedNodes?: Set<number>;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: number | GraphNode;
  target: number | GraphNode;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph,
  visitedNodes = new Set(),
  currentNode = null,
  queuedNodes = new Set()
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Handles Physics, Zoom, and initial DOM creation
  useEffect(() => {
    if (!graph || !svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight - 80; // Subtract TopBar height
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear previous render

    // Define grid pattern
    const defs = svg.append("defs");
    const pattern = defs
      .append("pattern")
      .attr("id", "grid-pattern")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");

    pattern
      .append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1);

    // Add background rect to render the grid and catch all zoom/pan events
    svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#grid-pattern)")
      .style("pointer-events", "all");

    // Create a master container for the graph elements
    const container = svg.append("g").attr("class", "graph-container");

    // Setup Zoom and Canvas Panning
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        pattern.attr(
          "patternTransform",
          `translate(${event.transform.x}, ${event.transform.y}) scale(${event.transform.k})`
        );
      });

    svg.call(zoom);

    const nodes: GraphNode[] = graph.getNodes().map((id) => ({ id }));
    const links: GraphLink[] = [];

    for (const nodeId of graph.getNodes()) {
      for (const edge of graph.getNeighbors(nodeId)) {
        links.push({ source: nodeId, target: edge.to });
      }
    }

    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Setup Node Dragging behavior
    const drag = d3
      .drag<SVGCircleElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const link = container
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#1f2937")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    const node = container
      .append("g")
      .attr("class", "nodes-group")
      .selectAll<SVGCircleElement, unknown>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 12)
      .attr("fill", "#4338ca") // Default color
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .call(drag); // Attach node dragging

    const labels = container
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.id)
      .attr("font-size", 12)
      .attr("font-weight", "600")
      .attr("dx", 15)
      .attr("dy", 4)
      .attr("fill", "#0f172a")
      .style("pointer-events", "none"); // Prevent labels from intercepting drag events

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      labels.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    });

    return () => {
      simulation.stop();
    };
  }, [graph]);

  // Handles only visual state updates (colors/sizes)
  useEffect(() => {
    if (!svgRef.current) return;

    // Select the nodes we created in the main effect
    const svg = d3.select(svgRef.current);
    const nodes = svg
      .select(".nodes-group")
      .selectAll<SVGCircleElement, GraphNode>("circle");

    // Animate color and size changes based on algorithm state
    nodes
      .transition()
      .duration(300)
      .attr("fill", (d) => {
        if (d.id === currentNode) return "#ef4444"; // Red: Currently evaluating
        if (visitedNodes.has(d.id)) return "#10b981"; // Green: Fully Visited
        if (queuedNodes.has(d.id)) return "#3b82f6"; // Blue: In Queue
        return "#4338ca"; // Indigo: Unvisited (Default)
      })
      .attr("r", (d) => (d.id === currentNode ? 16 : 12))
      .attr("stroke", (d) => (d.id === currentNode ? "#000000" : "#ffffff"));
  }, [visitedNodes, currentNode, queuedNodes]);

  return (
    <div className="grow bg-white overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full"></svg>
      {!graph && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-500 text-lg">
            Upload a graph file to begin visualization
          </p>
        </div>
      )}
    </div>
  );
};
