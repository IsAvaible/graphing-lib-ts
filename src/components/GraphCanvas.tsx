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

// Helper to reliably get IDs whether D3 has populated the object or not
const getId = (node: number | GraphNode) =>
  typeof node === "object" ? node.id : node;

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph,
  visualState
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(
    null
  );
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Handles Physics, Zoom, and initial DOM creation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

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

    // Static layer groups to keep rendering order correct
    container.append("g").attr("class", "links-group");
    container.append("g").attr("class", "edge-labels-group");
    container.append("g").attr("class", "nodes-group");
    container.append("g").attr("class", "node-labels-group");

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
    zoomRef.current = zoom;

    const simulation = d3
      .forceSimulation<GraphNode>([])
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>([])
          .id((d) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    simulation.on("tick", () => {
      container
        .select(".links-group")
        .selectAll<SVGLineElement, GraphLink>("line")
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      container
        .select(".nodes-group")
        .selectAll<SVGCircleElement, GraphNode>("circle")
        .attr("cx", (d) => d.x ?? 0)
        .attr("cy", (d) => d.y ?? 0);

      container
        .select(".node-labels-group")
        .selectAll<SVGTextElement, GraphNode>("text")
        .attr("x", (d) => d.x ?? 0)
        .attr("y", (d) => d.y ?? 0);

      // Keep edge labels centered on the link
      container
        .select(".edge-labels-group")
        .selectAll<SVGTextElement, GraphLink>("text")
        .attr("x", (d) => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return ((s.x ?? 0) + (t.x ?? 0)) / 2;
        })
        .attr("y", (d) => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return ((s.y ?? 0) + (t.y ?? 0)) / 2 - 4; // Lift slightly off dead-center
        });
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      svg.on(".zoom", null);
    };
  }, []);

  // Handles data updates for the graph nodes and links (Enter, Update, Exit)
  useEffect(() => {
    if (!simulationRef.current || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const container = svg.select(".graph-container");
    const simulation = simulationRef.current;

    const newNodesData: GraphNode[] = [];
    const newLinksData: GraphLink[] = [];
    let topologyChanged = false; // Track if we actually need to reheat the physics

    if (graph) {
      // Map existing nodes AND links by exact object reference
      const existingNodes = new Map(simulation.nodes().map((n) => [n.id, n]));

      const currentLinks =
        simulation.force<d3.ForceLink<GraphNode, GraphLink>>("link")?.links() ||
        [];
      const existingLinks = new Map(
        currentLinks.map((l) => [
          getEdgeKey(getId(l.source), getId(l.target)),
          l
        ])
      );

      // Preserve exact node objects
      graph.getNodes().forEach((id) => {
        const existing = existingNodes.get(id);
        if (existing) {
          newNodesData.push(existing); // Do NOT spread ({...existing}), keep exact reference
        } else {
          newNodesData.push({ id });
          topologyChanged = true;
        }
      });

      // Preserve exact link objects
      const seenLinks = new Set<string>();
      for (const nodeId of graph.getNodes()) {
        for (const edge of graph.getNeighbors(nodeId)) {
          const key = getEdgeKey(nodeId, edge.to);
          if (!seenLinks.has(key)) {
            seenLinks.add(key);

            const existingLink = existingLinks.get(key);
            if (existingLink) {
              // Just update the weight, keep the D3 object intact
              if (edge.kind === "weighted") existingLink.weight = edge.weight;
              newLinksData.push(existingLink);
            } else {
              const link: GraphLink = { source: nodeId, target: edge.to };
              if (edge.kind === "weighted") link.weight = edge.weight;
              newLinksData.push(link);
              topologyChanged = true;
            }
          }
        }
      }

      // Check for deletions
      if (
        existingNodes.size !== newNodesData.length ||
        existingLinks.size !== newLinksData.length
      ) {
        topologyChanged = true;
      }
    }

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

    // ----- ENTER / UPDATE / EXIT PATTERNS ----- //
    container
      .select(".nodes-group")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(newNodesData, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("r", 0)
            .attr("fill", "#cbd5e1")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .attr("cursor", "pointer")
            .call(drag)
            .call((e) => e.transition().duration(300).attr("r", 12)),
        (update) => update,
        (exit) =>
          exit.call((e) => e.transition().duration(300).attr("r", 0).remove())
      );

    container
      .select(".node-labels-group")
      .selectAll<SVGTextElement, GraphNode>("text")
      .data(newNodesData, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("text")
            .text((d) => d.id)
            .attr("font-size", 12)
            .attr("font-weight", "600")
            .attr("dx", 15)
            .attr("dy", 4)
            .attr("fill", "#0f172a")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .call((e) => e.transition().duration(300).style("opacity", 1)),
        (update) => update,
        (exit) =>
          exit.call((e) =>
            e.transition().duration(300).style("opacity", 0).remove()
          )
      );

    container
      .select(".links-group")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(newLinksData, (d) => getEdgeKey(getId(d.source), getId(d.target)))
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("stroke", "#e2e8f0")
            .attr("stroke-width", 2)
            .style("opacity", 0)
            .call((e) => e.transition().duration(300).style("opacity", 0.8)),
        (update) => update,
        (exit) =>
          exit.call((e) =>
            e.transition().duration(300).style("opacity", 0).remove()
          )
      );

    // Add Edge Labels for weighted edges
    container
      .select(".edge-labels-group")
      .selectAll<SVGTextElement, GraphLink>("text")
      .data(
        newLinksData.filter((l) => l.weight !== undefined),
        (d) => getEdgeKey(getId(d.source), getId(d.target))
      )
      .join(
        (enter) =>
          enter
            .append("text")
            .text((d) => d.weight!)
            .attr("font-size", 11)
            .attr("font-weight", "500")
            .attr("fill", "#64748b")
            .attr("text-anchor", "middle")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 3)
            .attr("paint-order", "stroke")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .call((e) => e.transition().duration(300).style("opacity", 1)),
        (update) => {
          // Update the text in case the weight changed on an existing edge
          update.text((d) => d.weight!);
          return update;
        },
        (exit) =>
          exit.call((e) =>
            e.transition().duration(300).style("opacity", 0).remove()
          )
      );

    simulation.nodes(newNodesData);
    simulation
      .force<d3.ForceLink<GraphNode, GraphLink>>("link")
      ?.links(newLinksData);

    // Only reheat if nodes/links were added or removed
    if (topologyChanged) {
      simulation.alpha(0.5).restart();
    }
  }, [graph]);

  // Handles only visual state updates (colors/sizes)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Select the nodes we created in the main effect
    // Animate color and size changes based on algorithm state
    svg
      .select(".nodes-group")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .transition("visual")
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

    // Transition label positions to prevent overlap when node grows
    svg
      .select(".node-labels-group")
      .selectAll<SVGTextElement, GraphNode>("text")
      .transition("visual")
      .duration(300)
      .attr("dx", (d) => (d.id === visualState.currentNode ? 22 : 15));

    // Update Links
    svg
      .select(".links-group")
      .selectAll<SVGLineElement, GraphLink>("line")
      .transition("visual")
      .duration(300)
      .attr("stroke", (d) => {
        const key = getEdgeKey(getId(d.source), getId(d.target));
        if (key === visualState.evaluatingEdge) return "#f97316"; // Orange: Evaluating
        if (visualState.highlightedEdges.has(key)) return "#22c55e"; // Green: Highlighted
        if (visualState.frontierEdges.has(key)) return "#facc15"; // Yellow: Frontier
        return "#e2e8f0"; // Default
      })
      .attr("stroke-width", (d) => {
        const key = getEdgeKey(getId(d.source), getId(d.target));
        if (
          key === visualState.evaluatingEdge ||
          visualState.highlightedEdges.has(key)
        )
          return 4;
        return 2;
      });
  }, [visualState]);

  useEffect(() => {
    if (!containerRef.current) return;
    let currentWidth = containerRef.current.clientWidth;
    let currentHeight = containerRef.current.clientHeight;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length || !svgRef.current || !zoomRef.current) return;
      const { width, height } = entries[0].contentRect;

      // Ignore phantom resizes when dimensions are 0
      if (width === 0 || height === 0) return;

      const svg = d3.select(svgRef.current);

      // 1Update the internal zoom extent so boundaries remain correct
      zoomRef.current.extent([
        [0, 0],
        [width, height]
      ]);

      const t = d3.zoomTransform(svgRef.current);

      // Calculate new scale from diagonal ratio
      const currentDiagonal = Math.hypot(currentWidth, currentHeight);
      const newDiagonal = Math.hypot(width, height);
      const scaleRatio = newDiagonal / currentDiagonal;

      // Get scale limits
      const [minZoom, maxZoom] = zoomRef.current.scaleExtent();
      const newK = Math.max(minZoom, Math.min(maxZoom, t.k * scaleRatio));

      // Find Center
      const dataCenterX = (currentWidth / 2 - t.x) / t.k;
      const dataCenterY = (currentHeight / 2 - t.y) / t.k;

      // Calculate translation
      const newTx = width / 2 - dataCenterX * newK;
      const newTy = height / 2 - dataCenterY * newK;

      // Apply calculated transform
      const newTransform = d3.zoomIdentity.translate(newTx, newTy).scale(newK);
      svg.call(zoomRef.current.transform, newTransform);

      if (simulationRef.current) {
        simulationRef.current.force(
          "center",
          d3.forceCenter(width / 2, height / 2)
        );
        simulationRef.current.alpha(0.1).restart();
      }

      // 6. Update trackers for the next resize event
      currentWidth = width;
      currentHeight = height;
    });

    // Start observing the wrapper div
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full grow bg-white overflow-hidden relative"
    >
      <svg ref={svgRef} className="w-full h-full"></svg>
      {!graph && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300">
          <p className="text-gray-500 text-lg">
            Upload a graph file to begin visualization
          </p>
        </div>
      )}
    </div>
  );
};
