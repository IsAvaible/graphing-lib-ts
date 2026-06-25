export type GeneralTranslationKey =
  | "notes.title"
  | "notes.title_ek"
  | "notes.max_flow"
  | "notes.decomposed_components"
  | "notes.type_path"
  | "notes.type_cycle";

export type EdmondsKarpTranslationKey =
  | "edmonds_karp.start"
  | "edmonds_karp.bfs_start"
  | "edmonds_karp.bfs_pop"
  | "edmonds_karp.bfs_examine_edge"
  | "edmonds_karp.bfs_edge_valid"
  | "edmonds_karp.no_path"
  | "edmonds_karp.path_found"
  | "edmonds_karp.augment_flow";

export type FlowDecompTranslationKey =
  | "flow_decomp.start"
  | "flow_decomp.complete"
  | "flow_decomp.select_start_edge"
  | "flow_decomp.forward_search"
  | "flow_decomp.examine_edge"
  | "flow_decomp.backward_search_start"
  | "flow_decomp.examine_edge_backward"
  | "flow_decomp.found_component"
  | "flow_decomp.subtract_flow";

export type CCTranslationKey = "cc.start_component" | "cc.traverse_bfs";

export type PrimTranslationKey =
  | "prim.start"
  | "prim.evaluate_visited"
  | "prim.evaluate_unvisited";

export type KruskalTranslationKey =
  | "kruskal.uf_step"
  | "kruskal.edge_accepted"
  | "kruskal.edge_rejected";

export type DijkstraTranslationKey =
  | "dijkstra.start"
  | "dijkstra.pop_node"
  | "dijkstra.evaluate_edge"
  | "dijkstra.relax_edge"
  | "dijkstra.complete";

export type BellmanFordTranslationKey =
  | "bellman_ford.init"
  | "bellman_ford.evaluate_edge"
  | "bellman_ford.relax_edge"
  | "bellman_ford.check_negative_cycle"
  | "bellman_ford.complete";

export type NearestNeighborTranslationKey =
  | "nearest_neighbor.init"
  | "nearest_neighbor.visit_node"
  | "nearest_neighbor.complete";

export type DoubleTreeTranslationKey =
  | "double_tree.mst"
  | "double_tree.dfs"
  | "double_tree.complete";

export type BruteForceTranslationKey =
  | "brute_force.evaluating"
  | "brute_force.complete";

export type BranchAndBoundTranslationKey =
  | "branch_and_bound.evaluating"
  | "branch_and_bound.prune"
  | "branch_and_bound.prune_symmetry"
  | "branch_and_bound.new_best"
  | "branch_and_bound.complete";

export type TranslationKey =
  | GeneralTranslationKey
  | EdmondsKarpTranslationKey
  | FlowDecompTranslationKey
  | CCTranslationKey
  | PrimTranslationKey
  | KruskalTranslationKey
  | DijkstraTranslationKey
  | BellmanFordTranslationKey
  | NearestNeighborTranslationKey
  | DoubleTreeTranslationKey
  | BruteForceTranslationKey
  | BranchAndBoundTranslationKey;

export interface LocalizedNote {
  key: TranslationKey;
  params?: Record<string, any>;
}

export type Language = "en" | "de";

const enTranslations: Record<TranslationKey, string> = {
  "notes.title": "Step Details",
  "notes.title_ek": "Step Details (Edmonds-Karp)",
  "notes.max_flow": "Maximum Flow: {maxFlow}",
  "notes.decomposed_components": "Decomposed Components ({count}):",
  "notes.type_path": "Path",
  "notes.type_cycle": "Cycle",

  "edmonds_karp.start":
    "Starting Edmonds-Karp algorithm. Source: {s}, Sink: {t}.",
  "edmonds_karp.bfs_start":
    "BFS search started: Searching for the shortest augmenting path from {s} to {t} in the residual network.",
  "edmonds_karp.bfs_pop":
    "BFS: Dequeue node {u} and examine outgoing residual edges.",
  "edmonds_karp.bfs_examine_edge":
    "BFS: Examine residual edge {u} -> {v} (residual capacity: {capacity}).",
  "edmonds_karp.bfs_edge_valid":
    "BFS: Edge {u} -> {v} is valid. Node {v} visited and added to queue.",
  "edmonds_karp.no_path":
    "No more augmenting path found in the residual network. Edmonds-Karp finished. Max flow: {maxFlow}.",
  "edmonds_karp.path_found":
    "Augmenting path found: {path}. Bottleneck capacity: \u03B4 = {delta}.",
  "edmonds_karp.augment_flow":
    "Increase flow by \u03B4 = {delta} along the path. Update edge flows in main network.",

  "flow_decomp.start":
    "Starting flow decomposition. Identified source: {s}, sink: {t}.",
  "flow_decomp.complete":
    "No edges with remaining positive flow found. Decomposition complete!",
  "flow_decomp.select_start_edge":
    "Choose edge ({v0}, {w0}) with positive flow value {flow} as start.",
  "flow_decomp.forward_search":
    "Forward search at node {curr}. Search for outgoing edge with positive flow.",
  "flow_decomp.examine_edge":
    "Examine edge ({curr}, {nextNode}) with positive flow {flow}.",
  "flow_decomp.backward_search_start":
    "Forward search finished (sink reached). Backward search at node {curr}. Search for incoming edge with positive flow.",
  "flow_decomp.examine_edge_backward":
    "Examine incoming edge ({prevNode}, {curr}) with positive flow {flow}.",
  "flow_decomp.found_component":
    "Found {type}: {path}. Bottleneck flow is \u03BC = {mu}.",
  "flow_decomp.subtract_flow":
    "Subtract flow \u03BC = {mu} from all edges on the {type}.",

  "cc.start_component":
    "New unvisited node {node} found. Starting component #{count}.",
  "cc.traverse_bfs":
    "Traversing component #{count}. BFS at node {currentNode}. Queue: {queue}.",

  "prim.start": "Starting Prim's MST algorithm. Start node: {startNode}.",
  "prim.evaluate_visited":
    "Checking edge ({from} - {to}, weight: {weight}). Both endpoints are already visited, skipping.",
  "prim.evaluate_unvisited":
    "Checking edge ({from} - {to}, weight: {weight}). Adding node {to} to MST.",

  "kruskal.uf_step":
    "Kruskal: Checking edge ({from} - {to}, weight: {weight}). Union-Find checking representatives.",
  "kruskal.edge_accepted":
    "Edge ({from} - {to}, weight: {weight}) does not form a cycle. Added to MST.",
  "kruskal.edge_rejected":
    "Edge ({from} - {to}, weight: {weight}) forms a cycle. Skipped.",

  "dijkstra.start": "Starting Dijkstra's algorithm. Start node: {startNode}.",
  "dijkstra.pop_node": "Dequeue node {u} with distance {dist} from the queue.",
  "dijkstra.evaluate_edge":
    "Examining edge ({from} -> {to}, weight: {weight}).",
  "dijkstra.relax_edge":
    "Relaxation successful! Update distance of {to} to {newDist}.",
  "dijkstra.complete": "Dijkstra finished. Shortest paths found.",

  "bellman_ford.init": "Initialize distances. Start node: {startNode}.",
  "bellman_ford.evaluate_edge":
    "Iteration {iteration}: Examining edge ({from} -> {to}, weight: {weight}).",
  "bellman_ford.relax_edge":
    "Iteration {iteration}: Relaxation successful! Update distance of {to} to {newDist}.",
  "bellman_ford.check_negative_cycle":
    "Checking for negative cycles on edge ({from} -> {to}, weight: {weight}).",
  "bellman_ford.complete": "Bellman-Ford finished. No negative cycles found.",

  "nearest_neighbor.init":
    "Starting Nearest Neighbor TSP. Start node: {currentNode}.",
  "nearest_neighbor.visit_node":
    "Choose next edge ({from} -> {to}, weight: {weight}) to unvisited neighbor.",
  "nearest_neighbor.complete": "Close the tour by returning to the start node.",

  "double_tree.mst":
    "Step 1: Compute the Minimum Spanning Tree (MST) using Kruskal.",
  "double_tree.dfs": "Step 2 & 3: Traverse MST via DFS. Visit node {current}.",
  "double_tree.complete":
    "Step 4: Close Hamiltonian cycle using shortcuts back to start.",

  "brute_force.evaluating":
    "Checking tour {tour}. Total cost: {cost}. (Current best cost: {bestCost})",
  "brute_force.complete":
    "Brute-Force finished. Optimal tour found with cost {bestCost}.",

  "branch_and_bound.evaluating":
    "Visit {node} in tour {tour} (cost: {cost}). Best known cost: {bestCost}.",
  "branch_and_bound.prune":
    "Branch pruned: Current cost ({cost}) already exceeds best known cost ({bestCost}).",
  "branch_and_bound.prune_symmetry":
    "Branch pruned due to symmetry breaking (tour order constraint).",
  "branch_and_bound.new_best": "New best tour found! Cost: {cost}.",
  "branch_and_bound.complete":
    "Branch & Bound finished. Best tour cost: {bestCost}. Pruned: {branchesPruned} branches."
};

const deTranslations: Record<TranslationKey, string> = {
  "notes.title": "Schritt-Details",
  "notes.title_ek": "Schritt-Details (Edmonds-Karp)",
  "notes.max_flow": "Maximaler Fluss: {maxFlow}",
  "notes.decomposed_components": "Zerlegte Komponenten ({count}):",
  "notes.type_path": "Weg",
  "notes.type_cycle": "Kreis",

  "edmonds_karp.start":
    "Starte Edmonds-Karp Algorithmus. Quelle: {s}, Senke: {t}.",
  "edmonds_karp.bfs_start":
    "BFS-Suche gestartet: Suche nach dem kürzesten augmentierenden Weg von {s} zu {t} im Residualnetzwerk.",
  "edmonds_karp.bfs_pop":
    "BFS: Entnehme Knoten {u} aus der Warteschlange und untersuche ausgehende Residualkanten.",
  "edmonds_karp.bfs_examine_edge":
    "BFS: Untersuche Residualkante {u} -> {v} (Restkapazität: {capacity}).",
  "edmonds_karp.bfs_edge_valid":
    "BFS: Kante {u} -> {v} ist zulässig. Knoten {v} besucht und zur Warteschlange hinzugefügt.",
  "edmonds_karp.no_path":
    "Kein augmentierender Weg mehr im Residualnetzwerk gefunden. Edmonds-Karp beendet. Maximaler Fluss: {maxFlow}.",
  "edmonds_karp.path_found":
    "Augmentierender Weg gefunden: {path}. Engpasskapazität: \u03B4 = {delta}.",
  "edmonds_karp.augment_flow":
    "Erhöhe den Fluss um \u03B4 = {delta} entlang des Weges. Aktualisiere Kantenflüsse im Hauptnetzwerk.",

  "flow_decomp.start":
    "Starte Flussdekomposition. Identifizierte Quelle: {s}, Senke: {t}.",
  "flow_decomp.complete":
    "Keine Kanten mit verbleibendem positivem Fluss gefunden. Dekomposition ist abgeschlossen!",
  "flow_decomp.select_start_edge":
    "Wähle Kante ({v0}, {w0}) mit positivem Flusswert {flow} als Start.",
  "flow_decomp.forward_search":
    "Vorwärtssuche bei Knoten {curr}. Suche ausgehende Kante mit positivem Fluss.",
  "flow_decomp.examine_edge":
    "Untersuche Kante ({curr}, {nextNode}) mit positivem Fluss {flow}.",
  "flow_decomp.backward_search_start":
    "Vorwärtssuche beendet (Senke erreicht). Rückwärtssuche bei Knoten {curr}. Suche eingehende Kante mit positivem Fluss.",
  "flow_decomp.examine_edge_backward":
    "Untersuche eingehende Kante ({prevNode}, {curr}) mit positivem Fluss {flow}.",
  "flow_decomp.found_component":
    "Gefundener {type}: {path}. Engpassfluss (Bottleneck) ist \u03BC = {mu}.",
  "flow_decomp.subtract_flow":
    "Subtrahiere Fluss \u03BC = {mu} von allen Kanten auf dem {type}.",

  "cc.start_component":
    "Neuer unbesuchter Knoten {node} gefunden. Starte Komponente #{count}.",
  "cc.traverse_bfs":
    "Traversiere Komponente #{count}. BFS bei Knoten {currentNode}. Warteschlange: {queue}.",

  "prim.start": "Starte Prim's MST Algorithmus. Startknoten: {startNode}.",
  "prim.evaluate_visited":
    "Prüfe Kante ({from} - {to}, Gewicht: {weight}). Beide Endpunkte sind bereits besucht, übersprunge.",
  "prim.evaluate_unvisited":
    "Prüfe Kante ({from} - {to}, Gewicht: {weight}). Füge Knoten {to} zum MST hinzu.",

  "kruskal.uf_step":
    "Kruskal: Prüfe Kante ({from} - {to}, Gewicht: {weight}). Union-Find prüft Repräsentanten.",
  "kruskal.edge_accepted":
    "Kante ({from} - {to}, Gewicht: {weight}) bildet keinen Kreis. Zum MST hinzugefügt.",
  "kruskal.edge_rejected":
    "Kante ({from} - {to}, Gewicht: {weight}) bildet einen Kreis. Übersprungen.",

  "dijkstra.start": "Starte Dijkstra Algorithmus. Startknoten: {startNode}.",
  "dijkstra.pop_node": "Entnehme Knoten {u} mit Distanz {dist} aus der Queue.",
  "dijkstra.evaluate_edge": "Prüfe Kante ({from} -> {to}, Gewicht: {weight}).",
  "dijkstra.relax_edge":
    "Relaxation erfolgreich! Aktualisiere Distanz von {to} auf {newDist}.",
  "dijkstra.complete": "Dijkstra beendet. Kürzeste Pfade gefunden.",

  "bellman_ford.init": "Initialisiere Distanzen. Startknoten: {startNode}.",
  "bellman_ford.evaluate_edge":
    "Iteration {iteration}: Prüfe Kante ({from} -> {to}, Gewicht: {weight}).",
  "bellman_ford.relax_edge":
    "Iteration {iteration}: Relaxation erfolgreich! Aktualisiere Distanz von {to} auf {newDist}.",
  "bellman_ford.check_negative_cycle":
    "Prüfe auf negative Kreise bei Kante ({from} -> {to}, Gewicht: {weight}).",
  "bellman_ford.complete":
    "Bellman-Ford beendet. Keine negativen Kreise gefunden.",

  "nearest_neighbor.init":
    "Starte Nächster-Nachbar TSP. Startknoten: {currentNode}.",
  "nearest_neighbor.visit_node":
    "Wähle nächste Kante ({from} -> {to}, Gewicht: {weight}) zum unbesuchten Nachbarn.",
  "nearest_neighbor.complete":
    "Schließe die Tour durch Rückkehr zum Startknoten.",

  "double_tree.mst":
    "Schritt 1: Berechne den minimalen Spannbaum (MST) mit Kruskal.",
  "double_tree.dfs":
    "Schritt 2 & 3: Traversiere MST via DFS. Besuche Knoten {current}.",
  "double_tree.complete":
    "Schritt 4: Schließe Hamiltonian-Kreis durch Shortcuts zurück zum Start.",

  "brute_force.evaluating":
    "Prüfe Tour {tour}. Gesamtkosten: {cost}. (Bisher beste Kosten: {bestCost})",
  "brute_force.complete":
    "Brute-Force beendet. Optimale Tour gefunden mit Kosten {bestCost}.",

  "branch_and_bound.evaluating":
    "Besuche {node} in Tour {tour} (Kosten: {cost}). Beste bekannte Kosten: {bestCost}.",
  "branch_and_bound.prune":
    "Zweig abgeschnitten: Aktuelle Kosten ({cost}) überschreiten bereits beste bekannte Kosten ({bestCost}).",
  "branch_and_bound.prune_symmetry":
    "Zweig abgeschnitten wegen Symmetriebruch (Kanalisierung der Tourreihenfolge).",
  "branch_and_bound.new_best": "Neue beste Tour gefunden! Kosten: {cost}.",
  "branch_and_bound.complete":
    "Branch & Bound beendet. Beste Tour Kosten: {bestCost}. Pruned: {branchesPruned} Zweige."
};

function formatValue(val: any): string {
  if (Array.isArray(val)) {
    return val.join(" \u2192 ");
  }
  if (typeof val === "number") {
    return val % 1 === 0 ? String(val) : Number(val.toFixed(5)).toString();
  }
  return String(val);
}

export function translate(key: TranslationKey, lang: Language): string {
  const dictionary = lang === "de" ? deTranslations : enTranslations;
  const fallbackDict = lang === "de" ? enTranslations : deTranslations;

  let template = dictionary[key];
  if (!template) {
    // Graceful fallback to the other language dictionary
    template = fallbackDict[key];
  }
  if (!template) {
    // Final fallback to the key itself to prevent crashes or empty strings
    return String(key);
  }
  return template;
}

export function translateNote(note: LocalizedNote, lang: Language): string {
  const template = translate(note.key, lang);
  if (!note.params) {
    return template;
  }

  let result = template;
  const dictionary = lang === "de" ? deTranslations : enTranslations;

  for (const [paramName, paramValue] of Object.entries(note.params)) {
    let processedValue = paramValue;
    if (typeof paramValue === "string" && paramValue in dictionary) {
      processedValue = translate(paramValue as TranslationKey, lang);
    }

    const formatted = formatValue(processedValue);
    result = result.replace(new RegExp(`\\{${paramName}\\}`, "g"), formatted);
  }
  return result;
}
