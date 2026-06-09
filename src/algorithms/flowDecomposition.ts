import { Graph } from "../core/Graph.ts";
import type { FlowEdge } from "../core/types.ts";
import { runGenerator } from "./utils.ts";

export interface DecomposedElement<T> {
  path: T[];
  flow: number;
  isCycle: boolean;
}

export interface FlowDecompositionStepState<T> {
  currentNode: T | null;
  visitedNodes: Set<T>;
  queuedNodes: Set<T>;
  highlightedEdges: Set<string>; // Format: 'from->to'
  frontierEdges: Set<string>; // Format: 'from->to'
  evaluatingEdge: { from: T; to: T } | null;
  decomposedPaths: DecomposedElement<T>[];
  notes: string;
  graph: Graph<T, true, FlowEdge<T>>;
}

/**
 * A Generator that yields the state of the Ford-Fulkerson Flow Decomposition Algorithm at each step.
 */
export function* flowDecompositionGenerator<T extends string | number>(
  graph: Graph<T, boolean, FlowEdge<T>>,
  recordState: boolean = true
): Generator<FlowDecompositionStepState<T>, DecomposedElement<T>[], unknown> {
  // 1. Clone the graph (forcing it as directed for flow operations)
  const clone = new Graph<T, true, FlowEdge<T>>(true);
  for (const node of graph.getNodes()) {
    clone.addNode(node);
  }
  for (const node of graph.getNodes()) {
    for (const edge of graph.getNeighbors(node)) {
      if (edge.kind === "flow") {
        clone.addEdge({ ...edge } as FlowEdge<T>);
      }
    }
  }

  const decomposedPaths: DecomposedElement<T>[] = [];

  // 2. Identify source s and sink t by computing net flows: outgoing - incoming
  const netFlows = new Map<T, number>();
  for (const node of clone.getNodes()) {
    netFlows.set(node, 0);
  }
  for (const node of clone.getNodes()) {
    for (const edge of clone.getNeighbors(node)) {
      if (edge.flow > 0) {
        netFlows.set(edge.from, (netFlows.get(edge.from) || 0) + edge.flow);
        netFlows.set(edge.to, (netFlows.get(edge.to) || 0) - edge.flow);
      }
    }
  }

  let s: T | null = null;
  let t: T | null = null;
  let maxOutgoing = 0;
  let maxIncoming = 0;

  for (const [node, flow] of netFlows.entries()) {
    if (flow > maxOutgoing) {
      maxOutgoing = flow;
      s = node;
    }
    if (-flow > maxIncoming) {
      maxIncoming = -flow;
      t = node;
    }
  }

  // If net flow is zero or negligible, treat s and t as null (we will only find cycles)
  if (maxOutgoing < 1e-9) s = null;
  if (maxIncoming < 1e-9) t = null;

  // Helper to extract state
  const getState = (
    currentNode: T | null,
    currentPath: T[],
    evaluatingEdge: { from: T; to: T } | null,
    notes: string
  ): FlowDecompositionStepState<T> => {
    const pathEdges = new Set<string>();
    for (let i = 0; i < currentPath.length - 1; i++) {
      pathEdges.add(`${currentPath[i]}->${currentPath[i + 1]}`);
    }

    const frontierEdges = new Set<string>();
    for (const n of clone.getNodes()) {
      for (const e of clone.getNeighbors(n)) {
        if (e.flow > 0) {
          frontierEdges.add(`${e.from}->${e.to}`);
        }
      }
    }

    return {
      currentNode,
      visitedNodes: new Set(currentPath),
      queuedNodes: new Set(currentPath),
      highlightedEdges: pathEdges,
      frontierEdges,
      evaluatingEdge,
      decomposedPaths: [...decomposedPaths],
      notes,
      graph: clone
    };
  };

  if (recordState) {
    yield getState(
      null,
      [],
      null,
      `Starte Flussdekomposition. Identifizierte Quelle: ${s ?? "Keine (Nettofluss ist 0)"}, Senke: ${t ?? "Keine"}.`
    );
  }

  while (true) {
    // Find the first edge with positive flow
    let startEdge: FlowEdge<T> | null = null;
    for (const node of clone.getNodes()) {
      for (const edge of clone.getNeighbors(node)) {
        if (edge.flow > 0) {
          startEdge = edge;
          break;
        }
      }
      if (startEdge) break;
    }

    // // Collect all edges with positive flow
    // const availableEdges: FlowEdge<T>[] = [];
    // for (const node of clone.getNodes()) {
    //   for (const edge of clone.getNeighbors(node)) {
    //     if (edge.flow > 0) {
    //       availableEdges.push(edge as FlowEdge<T>);
    //     }
    //   }
    // }
    //
    // // Pick a random edge if any exist
    // let startEdge: FlowEdge<T> | null = null;
    // if (availableEdges.length > 0) {
    //   const randomIndex = Math.floor(Math.random() * availableEdges.length);
    //   startEdge = availableEdges[randomIndex];
    // }

    if (!startEdge) {
      if (recordState) {
        yield getState(
          null,
          [],
          null,
          `Keine Kanten mit verbleibendem positivem Fluss gefunden. Dekomposition ist abgeschlossen!`
        );
      }
      break;
    }

    const v0 = startEdge.from;
    const w0 = startEdge.to;

    if (recordState) {
      yield getState(
        v0,
        [v0],
        { from: v0, to: w0 },
        `Wähle Kante (${v0}, ${w0}) mit positivem Flusswert ${startEdge.flow} als Start.`
      );
    }

    // Initialize sequence
    let sequence: T[] = [v0, w0];
    let visitedInSeq = new Set<T>([v0, w0]);
    let cycleFound = false;
    let cycleStartNode: T | null = null;

    // --- FORWARD SEARCH FROM w0 ---
    let curr = w0;
    while (curr !== t) {
      if (recordState) {
        yield getState(
          curr,
          sequence,
          null,
          `Vorwärtssuche bei Knoten ${curr}. Suche ausgehende Kante mit positivem Fluss.`
        );
      }

      // Find an outgoing edge from curr with positive flow
      let nextEdge: FlowEdge<T> | null = null;
      for (const edge of clone.getNeighbors(curr)) {
        if (edge.flow > 0) {
          nextEdge = edge;
          break;
        }
      }

      if (!nextEdge) {
        break;
      }

      const nextNode = nextEdge.to;
      if (recordState) {
        yield getState(
          curr,
          sequence,
          { from: curr, to: nextNode },
          `Untersuche Kante (${curr}, ${nextNode}) mit positivem Fluss ${nextEdge.flow}.`
        );
      }

      if (visitedInSeq.has(nextNode)) {
        cycleFound = true;
        cycleStartNode = nextNode;
        sequence.push(nextNode);
        break;
      }

      sequence.push(nextNode);
      visitedInSeq.add(nextNode);
      curr = nextNode;
    }

    // --- BACKWARD SEARCH FROM v0 ---
    // Only run if we reached t without finding a cycle
    if (!cycleFound && s !== null && v0 !== s) {
      curr = v0;
      while (curr !== s) {
        if (recordState) {
          yield getState(
            curr,
            sequence,
            null,
            `Vorwärtssuche beendet (Senke erreicht). Rückwärtssuche bei Knoten ${curr}. Suche eingehende Kante mit positivem Fluss.`
          );
        }

        // Find an incoming edge to curr with positive flow
        let prevEdge: FlowEdge<T> | null = null;
        for (const u of clone.getNodes()) {
          const edge = clone.getEdge(u, curr);
          if (edge && edge.flow > 0) {
            prevEdge = edge as FlowEdge<T>;
            break;
          }
        }

        if (!prevEdge) {
          break;
        }

        const prevNode = prevEdge.from;
        if (recordState) {
          yield getState(
            curr,
            sequence,
            { from: prevNode, to: curr },
            `Untersuche eingehende Kante (${prevNode}, ${curr}) mit positivem Fluss ${prevEdge.flow}.`
          );
        }

        if (visitedInSeq.has(prevNode)) {
          cycleFound = true;
          cycleStartNode = prevNode;
          sequence.unshift(prevNode);
          break;
        }

        sequence.unshift(prevNode);
        visitedInSeq.add(prevNode);
        curr = prevNode;
      }
    }

    // Now sequence contains either a cycle or an s-t path
    let path: T[];
    let isCycle = false;

    if (cycleFound && cycleStartNode !== null) {
      isCycle = true;
      const firstIdx = sequence.indexOf(cycleStartNode);
      const lastIdx = sequence.lastIndexOf(cycleStartNode);
      path = sequence.slice(firstIdx, lastIdx + 1);
    } else {
      path = sequence;
    }

    // Compute bottleneck flow \mu on path
    let mu = Infinity;
    const pathEdges: { from: T; to: T }[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      pathEdges.push({ from: u, to: v });
      const edge = clone.getEdge(u, v);
      if (edge && edge.flow < mu) {
        mu = edge.flow;
      }
    }

    if (mu === Infinity || mu <= 0) {
      break;
    }

    const typeStr = isCycle ? "Kreis" : "Weg";
    if (recordState) {
      const finalState = getState(
        null,
        path,
        null,
        `Gefundener ${typeStr}: ${path.join(" -> ")}. Engpassfluss (Bottleneck) ist \u03BC = ${mu}.`
      );
      finalState.highlightedEdges = new Set(
        pathEdges.map((e) => `${e.from}->${e.to}`)
      );
      yield finalState;
    }

    // Subtract \mu from edges on the path
    for (const { from: u, to: v } of pathEdges) {
      const edge = clone.getEdge(u, v);
      if (edge) {
        // @ts-ignore The interface forbids writes as a safeguard
        edge.flow -= mu;
      }
    }

    // Add to decomposed list
    decomposedPaths.push({ path, flow: mu, isCycle });

    if (recordState) {
      const subtractedState = getState(
        null,
        path,
        null,
        `Subtrahiere Fluss \u03BC = ${mu} von allen Kanten auf dem ${typeStr}.`
      );
      subtractedState.highlightedEdges = new Set(
        pathEdges.map((e) => `${e.from}->${e.to}`)
      );
      yield subtractedState;
    }
  }

  return decomposedPaths;
}

/**
 * Standard utility wrapper to run flow decomposition instantly.
 */
export function flowDecomposition<T extends string | number>(
  graph: Graph<T, boolean, FlowEdge<T>>
): DecomposedElement<T>[] {
  return runGenerator(flowDecompositionGenerator(graph, false));
}
