import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Graph } from "../core/Graph";
import { getEdgeKey, type VisualState } from "@/ui/types.ts";

interface GraphCanvasProps {
  graph: Graph<number> | null;
  visualState: VisualState<number>; // Passing the whole object is much cleaner now
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: number | GraphNode;
  target: number | GraphNode;
  weight?: number; // Added to store weight for display
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph,
  visualState
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

    // To prevent duplicate undirected links from rendering twice over each other:
    const seenLinks = new Set<string>();
    for (const nodeId of graph.getNodes()) {
      for (const edge of graph.getNeighbors(nodeId)) {
        const key = getEdgeKey(nodeId, edge.to);
        if (!seenLinks.has(key)) {
          seenLinks.add(key);
          const link: GraphLink = { source: nodeId, target: edge.to };
          // Only assign weight if it's a weighted edge type
          if (edge.kind === "weighted") {
            link.weight = edge.weight;
          }
          links.push(link);
        }
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
      .attr("class", "links-group")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 2);

    // Add Edge Labels for weighted edges
    const edgeLabels = container
      .append("g")
      .attr("class", "edge-labels-group")
      .selectAll("text")
      .data(links.filter((l) => l.weight !== undefined)) // Only render if weight exists
      .join("text")
      .text((d) => d.weight!)
      .attr("font-size", 11)
      .attr("font-weight", "500")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      // Adding a subtle white outline makes it much easier to read over the links
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .attr("paint-order", "stroke")
      .style("pointer-events", "none");

    const node = container
      .append("g")
      .attr("class", "nodes-group")
      .selectAll<SVGCircleElement, unknown>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 12)
      .attr("fill", "#cbd5e1")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .call(drag);

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

      // Keep edge labels centered on the link
      edgeLabels
        .attr(
          "x",
          (d) =>
            (((d.source as GraphNode).x ?? 0) +
              ((d.target as GraphNode).x ?? 0)) /
            2
        )
        .attr(
          "y",
          (d) =>
            (((d.source as GraphNode).y ?? 0) +
              ((d.target as GraphNode).y ?? 0)) /
              2 -
            4
        ); // Lift slightly off dead-center
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
        if (d.id === visualState.currentNode) return "#ef4444"; // Red: Evaluating
        if (visualState.queuedNodes.has(d.id)) return "#facc15"; // Yellow: Queued
        if (visualState.visitedNodes.has(d.id)) return "#4338ca"; // Indigo: Visited
        return "#cbd5e1"; // Unvisited
      })
      .attr("r", (d) => (d.id === visualState.currentNode ? 16 : 12))
      .attr("stroke", (d) =>
        d.id === visualState.currentNode ? "#000000" : "#ffffff"
      );

    // Update Links
    const links = svg
      .select(".links-group")
      .selectAll<SVGLineElement, GraphLink>("line");
    links
      .transition()
      .duration(300)
      .attr("stroke", (d) => {
        const sourceId = typeof d.source === "object" ? d.source.id : d.source;
        const targetId = typeof d.target === "object" ? d.target.id : d.target;
        const key = getEdgeKey(sourceId, targetId);

        if (key === visualState.evaluatingEdge) return "#f97316"; // Orange: Evaluating
        if (visualState.mstEdges.has(key)) return "#22c55e"; // Green: MST Confirmed
        if (visualState.availableEdges.has(key)) return "#facc15"; // Yellow: Frontier (Prim's)
        return "#e2e8f0"; // Default
      })
      .attr("stroke-width", (d) => {
        const sourceId = typeof d.source === "object" ? d.source.id : d.source;
        const targetId = typeof d.target === "object" ? d.target.id : d.target;
        const key = getEdgeKey(sourceId, targetId);

        if (key === visualState.evaluatingEdge || visualState.mstEdges.has(key))
          return 4;
        return 2;
      });
  }, [visualState]);

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
