"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, CircleDot, FileText, GitBranch, Lightbulb, Network, Search, Target, Trophy } from "lucide-react";
import type { KnowledgeGraph, KnowledgeGraphEdge, KnowledgeGraphNode, GraphNodeKind, GraphRelationship } from "@/lib/knowledgeGraph";

type MapView = "trace" | "themes" | "gaps";

interface KnowledgeGraphMapProps {
  graph: KnowledgeGraph;
  onOpenItem: (itemId: string) => void;
}

const nodeStyle: Record<GraphNodeKind, { label: string; border: string; background: string; accent: string; Icon: typeof FileText }> = {
  theme: { label: "Theme", border: "border-[#c8d2c3]", background: "bg-[#eef0e8]", accent: "text-[#61745b]", Icon: CircleDot },
  evidence: { label: "Evidence", border: "border-[#cbd5dc]", background: "bg-[#eef3f5]", accent: "text-[#607989]", Icon: FileText },
  decision: { label: "Decision", border: "border-[#7d8b75]", background: "bg-[#f7f8f2]", accent: "text-[#3f513a]", Icon: GitBranch },
  assumption: { label: "Assumption", border: "border-[#e1cba8]", background: "bg-[#fbf3e5]", accent: "text-[#9a6c38]", Icon: Lightbulb },
  action: { label: "Action", border: "border-[#bfd2bd]", background: "bg-[#edf5ec]", accent: "text-[#52704f]", Icon: Target },
  outcome: { label: "Outcome", border: "border-[#d1c5dc]", background: "bg-[#f3eef7]", accent: "text-[#735f84]", Icon: Trophy },
};

const relationshipLabel: Record<GraphRelationship, string> = {
  frames: "frames",
  supports: "supports",
  informed: "informed",
  assumes: "assumes",
  created_action: "created action",
  expects: "expects",
  resulted_in: "resulted in",
  contains: "packed into",
};

const relationshipColor: Record<GraphRelationship, string> = {
  frames: "#9aab92",
  supports: "#8199a7",
  informed: "#71836a",
  assumes: "#c19058",
  created_action: "#6d9270",
  expects: "#8b78a0",
  resulted_in: "#735f84",
  contains: "#9a8e7d",
};

function connectedNodeIds(graph: KnowledgeGraph, seeds: string[], depth: number, includeEdge: (edge: KnowledgeGraphEdge) => boolean = () => true) {
  const visited = new Set(seeds);
  let frontier = seeds;
  for (let level = 0; level < depth && frontier.length; level += 1) {
    const next: string[] = [];
    graph.edges.forEach((edge) => {
      if (!includeEdge(edge)) return;
      if (frontier.includes(edge.source) && !visited.has(edge.target)) { visited.add(edge.target); next.push(edge.target); }
      if (frontier.includes(edge.target) && !visited.has(edge.source)) { visited.add(edge.source); next.push(edge.source); }
    });
    frontier = next;
  }
  return visited;
}

function columnFor(kind: GraphNodeKind) {
  if (kind === "theme") return 0;
  if (kind === "evidence") return 1;
  if (kind === "decision") return 2;
  if (kind === "assumption" || kind === "action") return 3;
  return 4;
}

const NODE_WIDTH = 216;
const NODE_HEIGHT = 104;
const COLUMN_GAP = 54;
const ROW_GAP = 26;
const CANVAS_PADDING = 28;

export default function KnowledgeGraphMap({ graph, onOpenItem }: KnowledgeGraphMapProps) {
  const confirmedDecisions = graph.nodes.filter((node) => node.kind === "decision" && node.status === "confirmed");
  const decisionNodes = confirmedDecisions.length ? confirmedDecisions : graph.nodes.filter((node) => node.kind === "decision");
  const [view, setView] = useState<MapView>("trace");
  const [focusDecisionId, setFocusDecisionId] = useState(decisionNodes[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(decisionNodes[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const activeDecisionId = decisionNodes.some((node) => node.id === focusDecisionId) ? focusDecisionId : decisionNodes[0]?.id ?? "";

  const visibleGraph = useMemo(() => {
    let allowed: Set<string>;
    if (view === "trace" && activeDecisionId) {
      allowed = connectedNodeIds(graph, [activeDecisionId], 3, (edge) => edge.relationship !== "frames");
      graph.edges.filter((edge) => edge.relationship === "frames" && allowed.has(edge.target)).forEach((edge) => allowed.add(edge.source));
    } else if (view === "themes") {
      const themes = graph.nodes.filter((node) => node.kind === "theme").map((node) => node.id);
      allowed = connectedNodeIds(graph, themes, 1);
      graph.nodes.filter((node) => node.kind === "decision" && graph.edges.some((edge) => allowed.has(edge.source) && edge.target === node.id)).forEach((node) => allowed.add(node.id));
    } else {
      const open = graph.nodes.filter((node) => node.kind === "decision" && (node.gaps?.length ?? 0) > 0).map((node) => node.id);
      allowed = connectedNodeIds(graph, open, 1);
    }

    if (query.trim()) {
      const normalized = query.trim().toLocaleLowerCase();
      const matches = graph.nodes.filter((node) => `${node.label} ${node.detail} ${node.kind}`.toLocaleLowerCase().includes(normalized)).map((node) => node.id);
      const searchContext = connectedNodeIds(graph, matches, 1);
      allowed = new Set([...allowed].filter((id) => searchContext.has(id)));
    }

    const nodes = graph.nodes.filter((node) => allowed.has(node.id)).slice(0, 48);
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
    return { nodes, edges };
  }, [activeDecisionId, graph, query, view]);

  const layout = useMemo(() => {
    const columns: KnowledgeGraphNode[][] = Array.from({ length: 5 }, () => []);
    visibleGraph.nodes.forEach((node) => columns[columnFor(node.kind)].push(node));
    columns.forEach((column) => column.sort((left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0) || left.label.localeCompare(right.label)));
    const positions = new Map<string, { x: number; y: number }>();
    columns.forEach((column, columnIndex) => column.forEach((node, rowIndex) => positions.set(node.id, {
      x: CANVAS_PADDING + columnIndex * (NODE_WIDTH + COLUMN_GAP),
      y: 58 + rowIndex * (NODE_HEIGHT + ROW_GAP),
    })));
    const maxRows = Math.max(1, ...columns.map((column) => column.length));
    return {
      positions,
      width: CANVAS_PADDING * 2 + 5 * NODE_WIDTH + 4 * COLUMN_GAP,
      height: Math.max(520, 96 + maxRows * (NODE_HEIGHT + ROW_GAP)),
    };
  }, [visibleGraph.nodes]);

  const selected = visibleGraph.nodes.find((node) => node.id === selectedId) ?? visibleGraph.nodes[0] ?? null;
  const connections = selected ? graph.edges.filter((edge) => edge.source === selected.id || edge.target === selected.id) : [];
  const findNode = (id: string) => graph.nodes.find((node) => node.id === id);

  return (
    <section className="mt-6" aria-labelledby="knowledge-map-title">
      <div className="rounded-[20px] border border-[#d8d0c3] bg-[#fbf7ef] p-4 @md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="section-label">Decision map</p><h2 id="knowledge-map-title" className="mt-2 font-editorial text-2xl">Trace a decision from evidence to outcome.</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-[#686255]">The map uses links already saved between captures, decisions, actions, and outcomes. It does not edit your records.</p></div>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#f0e9dd] p-1 text-center">
            {[{ value: graph.summary.evidence, label: "evidence" }, { value: graph.summary.decisions, label: "decisions" }, { value: graph.summary.themes, label: "themes" }, { value: graph.summary.openLoops, label: "open loops" }].map((stat) => <div key={stat.label} className="min-w-16 rounded-lg bg-[#fbf7ef] px-2 py-2"><strong className="block text-sm">{stat.value}</strong><span className="text-[10px] text-[#7a7264]">{stat.label}</span></div>)}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {([['trace', 'Decision trace'], ['themes', 'Themes'], ['gaps', 'Missing context']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setView(value)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${view === value ? "bg-[#23231f] text-white" : "border border-[#ded6c8] bg-[#f8f2e8] text-[#5c5649]"}`}>{label}</button>)}
          {view === "trace" && decisionNodes.length > 0 && <select aria-label="Decision to trace" value={activeDecisionId} onChange={(event) => { setFocusDecisionId(event.target.value); setSelectedId(event.target.value); }} className="min-w-0 max-w-xs rounded-xl border border-[#ded6c8] bg-[#f8f2e8] px-3 py-2 text-xs font-semibold text-[#4a4740]">{decisionNodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select>}
          <label className="relative ml-auto min-w-48 flex-1 @md:max-w-xs"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a8278]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter the map" className="w-full rounded-xl border border-[#ded6c8] bg-[#f8f2e8] py-2 pl-8 pr-3 text-xs outline-none" /></label>
        </div>

        <div className="mt-4 grid gap-3 @3xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-auto rounded-[16px] border border-[#e0d8cc] bg-[radial-gradient(circle_at_1px_1px,#d8d0c3_1px,transparent_0)] bg-[size:20px_20px]" style={{ minHeight: 520 }}>
            {visibleGraph.nodes.length ? <div className="relative" style={{ width: layout.width, height: layout.height }}>
              <div className="absolute inset-x-0 top-0 grid grid-cols-5 gap-[54px] px-7 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a8278]">{["Themes", "Evidence", "Decisions", "Assumptions & actions", "Outcomes"].map((label) => <span key={label} style={{ width: NODE_WIDTH }}>{label}</span>)}</div>
              <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
                <defs><marker id="graph-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#9a958c" /></marker></defs>
                {visibleGraph.edges.map((edge) => {
                  const source = layout.positions.get(edge.source);
                  const target = layout.positions.get(edge.target);
                  if (!source || !target) return null;
                  const x1 = source.x + NODE_WIDTH;
                  const y1 = source.y + NODE_HEIGHT / 2;
                  const x2 = target.x;
                  const y2 = target.y + NODE_HEIGHT / 2;
                  const forward = x2 >= x1;
                  const bend = forward ? Math.max(30, (x2 - x1) / 2) : 42;
                  const path = forward ? `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}` : `M ${x1} ${y1} C ${x1 + bend} ${y1 - 54}, ${x2 - bend} ${y2 - 54}, ${x2} ${y2}`;
                  return <path key={edge.id} d={path} fill="none" stroke={relationshipColor[edge.relationship]} strokeWidth="1.6" strokeDasharray={edge.relationship === "assumes" || edge.relationship === "expects" ? "5 4" : undefined} opacity="0.72" markerEnd="url(#graph-arrow)" />;
                })}
              </svg>
              {visibleGraph.nodes.map((node) => {
                const position = layout.positions.get(node.id)!;
                const style = nodeStyle[node.kind];
                const Icon = style.Icon;
                const active = selected?.id === node.id;
                return <button key={node.id} type="button" onClick={() => setSelectedId(node.id)} aria-pressed={active} className={`absolute overflow-hidden rounded-[14px] border p-3 text-left shadow-sm transition ${style.border} ${style.background} ${active ? "ring-2 ring-[#23231f]/70 ring-offset-2" : "hover:-translate-y-0.5 hover:shadow-md"}`} style={{ left: position.x, top: position.y, width: NODE_WIDTH, height: NODE_HEIGHT }}><span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${style.accent}`}><Icon className="h-3.5 w-3.5" />{style.label}{node.status && <span className="ml-auto truncate normal-case tracking-normal opacity-75">{node.status}</span>}</span><strong className="mt-2 block line-clamp-2 text-[12px] leading-4 text-[#34332d]">{node.label}</strong>{(node.gaps?.length ?? 0) > 0 && <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#a05f58]"><AlertCircle className="h-3 w-3" />{node.gaps?.length} missing links</span>}</button>;
              })}
            </div> : <div className="flex min-h-[520px] items-center justify-center p-8 text-center"><div><Network className="mx-auto h-7 w-7 text-[#8a8278]" /><p className="mt-3 text-sm font-semibold">No linked records match this view.</p><p className="mt-2 text-xs text-[#7a7264]">Save a processed capture as a decision, then link an action to it.</p></div></div>}
          </div>

          <aside className="rounded-[16px] border border-[#ded6c8] bg-[#f8f2e8] p-4">
            {selected ? <><div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] ${nodeStyle[selected.kind].accent}`}>{(() => { const Icon = nodeStyle[selected.kind].Icon; return <Icon className="h-4 w-4" />; })()}{nodeStyle[selected.kind].label}</div><h3 className="mt-3 font-editorial text-xl leading-tight">{selected.label}</h3>{selected.status && <span className="mt-3 inline-flex rounded-full bg-[#ebe3d7] px-2 py-1 text-[10px] font-semibold text-[#686255]">{selected.status}</span>}<p className="mt-3 whitespace-pre-line text-xs leading-5 text-[#5c5649]">{selected.detail}</p>{selected.confidence != null && <p className="mt-3 text-[11px] font-semibold text-[#71836a]">{selected.confidence}% confidence</p>}{(selected.gaps?.length ?? 0) > 0 && <div className="mt-4 rounded-xl border border-[#e5c6c1] bg-[#fff1ef] p-3"><p className="flex items-center gap-1.5 text-[11px] font-bold text-[#8d5149]"><AlertCircle className="h-3.5 w-3.5" /> Context still missing</p><ul className="mt-2 space-y-1 text-[11px] text-[#7a4b45]">{selected.gaps?.map((gap) => <li key={gap}>• {gap}</li>)}</ul></div>}
              {selected.entityKind === "item" && selected.entityId && <button type="button" onClick={() => onOpenItem(selected.entityId!)} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#23231f] px-3 py-2.5 text-xs font-semibold text-white">Open saved item <ArrowUpRight className="h-3.5 w-3.5" /></button>}
              {selected.entityKind === "capture" && <Link href="/inbox" className="mt-4 flex items-center justify-between rounded-xl bg-[#23231f] px-3 py-2.5 text-xs font-semibold text-white">Open source capture <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
              {selected.entityKind === "action" && <Link href="/today" className="mt-4 flex items-center justify-between rounded-xl bg-[#23231f] px-3 py-2.5 text-xs font-semibold text-white">Open action <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
              <div className="mt-5 border-t border-[#ded6c8] pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a8278]">Connections</p><div className="mt-2 space-y-2">{connections.length ? connections.slice(0, 8).map((edge: KnowledgeGraphEdge) => { const otherId = edge.source === selected.id ? edge.target : edge.source; const other = findNode(otherId); if (!other) return null; return <button key={edge.id} type="button" onClick={() => setSelectedId(other.id)} className="block w-full rounded-lg border border-[#e2d9cd] bg-[#fbf7ef] px-2.5 py-2 text-left"><span className="block text-[10px] font-semibold text-[#71836a]">{relationshipLabel[edge.relationship]}</span><span className="mt-0.5 block line-clamp-1 text-[11px] font-semibold text-[#4a4740]">{other.label}</span><span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-[#8a8278]">{edge.reason}</span></button>; }) : <p className="text-[11px] leading-4 text-[#8a8278]">No saved connection yet.</p>}</div></div></> : <div className="flex min-h-64 items-center justify-center text-center"><div><Network className="mx-auto h-6 w-6 text-[#8a8278]" /><p className="mt-3 text-xs font-semibold">Select a node to see its saved connections.</p></div></div>}
          </aside>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-[#7a7264]">{Object.entries(nodeStyle).map(([kind, style]) => <span key={kind} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full border ${style.border} ${style.background}`} />{style.label}</span>)}</div>
      </div>
    </section>
  );
}
