import type { WorkspaceData } from "@/lib/workspace";

export type GraphNodeKind = "theme" | "evidence" | "decision" | "assumption" | "action" | "outcome";
export type GraphRelationship = "frames" | "supports" | "informed" | "assumes" | "created_action" | "expects" | "resulted_in" | "contains";
export type GraphEntityKind = "capture" | "item" | "action" | "synthetic";

export interface KnowledgeGraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  detail: string;
  entityKind: GraphEntityKind;
  entityId?: string;
  status?: string;
  confidence?: number;
  createdAt?: number;
  gaps?: string[];
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: GraphRelationship;
  reason: string;
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  summary: {
    decisions: number;
    evidence: number;
    openLoops: number;
    themes: number;
  };
}

const compact = (value: string, max = 220) => value.trim().replace(/\s+/g, " ").slice(0, max);
const themeKey = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, "-");

export function buildKnowledgeGraph(workspace: WorkspaceData): KnowledgeGraph {
  const nodeMap = new Map<string, KnowledgeGraphNode>();
  const edgeMap = new Map<string, KnowledgeGraphEdge>();
  const confirmedDecisionCaptureIds = new Set(workspace.items.filter((item) => item.type === "decision" && !item.archivedAt && item.sourceCaptureId).map((item) => item.sourceCaptureId));

  const addNode = (node: KnowledgeGraphNode) => {
    const existing = nodeMap.get(node.id);
    nodeMap.set(node.id, existing ? { ...existing, ...node, gaps: node.gaps ?? existing.gaps } : node);
  };
  const addEdge = (source: string, target: string, relationship: GraphRelationship, reason: string) => {
    if (!nodeMap.has(source) || !nodeMap.has(target)) return;
    const id = `${source}|${relationship}|${target}`;
    edgeMap.set(id, { id, source, target, relationship, reason });
  };
  const addTheme = (theme: string) => {
    const normalized = theme.trim();
    if (!normalized) return null;
    const id = `theme:${themeKey(normalized)}`;
    addNode({ id, kind: "theme", label: normalized, detail: `This topic appears in linked evidence or decisions about ${normalized}.`, entityKind: "synthetic" });
    return id;
  };

  workspace.captures.filter((capture) => capture.status !== "archived").forEach((capture) => {
    const id = `capture:${capture.id}`;
    addNode({
      id,
      kind: "evidence",
      label: capture.title || compact(capture.rawContent, 72) || "Untitled capture",
      detail: compact(capture.aiSummary || capture.transcript || capture.rawContent),
      entityKind: "capture",
      entityId: capture.id,
      status: capture.processingStatus === "ready" ? "processed evidence" : capture.status,
      confidence: capture.aiConfidence,
      createdAt: capture.createdAt,
    });
    (capture.aiThemes ?? []).forEach((theme) => {
      const themeId = addTheme(theme);
      if (themeId) addEdge(themeId, id, "frames", `“${theme}” is a theme extracted from this evidence.`);
    });

    if (!confirmedDecisionCaptureIds.has(capture.id)) (capture.aiDecisions ?? []).forEach((decision, index) => {
      const decisionId = `proposal:${capture.id}:${index}`;
      addNode({ id: decisionId, kind: "decision", label: compact(decision, 96), detail: "AI identified this possible decision from the capture. It has not been saved as a confirmed decision.", entityKind: "synthetic", status: "proposed", confidence: capture.aiConfidence, createdAt: capture.processedAt });
      addEdge(id, decisionId, "informed", "This evidence produced the proposed decision.");
      (capture.aiAssumptions ?? []).forEach((assumption, assumptionIndex) => {
        const assumptionId = `proposal-assumption:${capture.id}:${index}:${assumptionIndex}`;
        addNode({ id: assumptionId, kind: "assumption", label: compact(assumption, 110), detail: "An assumption inferred from the original capture.", entityKind: "synthetic", status: "proposed" });
        addEdge(decisionId, assumptionId, "assumes", "The proposed decision depends on this assumption.");
      });
    });
  });

  workspace.items.filter((item) => !item.archivedAt).forEach((item) => {
    const id = `item:${item.id}`;
    const isDecision = item.type === "decision";
    addNode({
      id,
      kind: isDecision ? "decision" : "evidence",
      label: item.title,
      detail: compact(item.summary || item.content),
      entityKind: "item",
      entityId: item.id,
      status: isDecision ? "confirmed" : item.type,
      confidence: item.decisionCalibration?.confidence,
      createdAt: item.createdAt,
    });
    if (item.sourceCaptureId) addEdge(`capture:${item.sourceCaptureId}`, id, isDecision ? "informed" : "supports", "This saved item links to the original capture.");
    item.tags.forEach((theme) => {
      const themeId = addTheme(theme);
      if (themeId) addEdge(themeId, id, "frames", `This saved item is tagged “${theme}”.`);
    });

    if (isDecision) {
      const assumptions = item.assumptions?.length ? item.assumptions : item.decisionCalibration?.assumptions ?? [];
      assumptions.forEach((assumption, index) => {
        const assumptionId = `assumption:${item.id}:${index}`;
        addNode({ id: assumptionId, kind: "assumption", label: compact(assumption, 110), detail: "A belief this decision depends on and should eventually be tested.", entityKind: "synthetic", status: item.decisionCalibration?.resolvedAt ? "reviewed" : "untested" });
        addEdge(id, assumptionId, "assumes", "This assumption is recorded on the decision.");
      });
      const calibration = item.decisionCalibration;
      if (calibration?.expectedOutcome) {
        const outcomeId = `outcome:${item.id}`;
        addNode({
          id: outcomeId,
          kind: "outcome",
          label: compact(calibration.actualOutcome || calibration.expectedOutcome, 110),
          detail: calibration.actualOutcome ? `Expected: ${calibration.expectedOutcome}\nActual: ${calibration.actualOutcome}` : `Forecast: ${calibration.expectedOutcome}`,
          entityKind: "synthetic",
          status: calibration.actualOutcome ? "observed" : "forecast",
          createdAt: calibration.resolvedAt || calibration.reviewAt,
        });
        addEdge(id, outcomeId, calibration.actualOutcome ? "resulted_in" : "expects", calibration.actualOutcome ? "This result was recorded after the decision." : "This result was forecast before it was known.");
      }
    }

    (item.capsuleSourceIds ?? []).forEach((sourceId) => {
      const sourceNodeId = nodeMap.has(`item:${sourceId}`) ? `item:${sourceId}` : nodeMap.has(`capture:${sourceId}`) ? `capture:${sourceId}` : nodeMap.has(`action:${sourceId}`) ? `action:${sourceId}` : null;
      if (sourceNodeId) addEdge(sourceNodeId, id, "contains", "This source is attached to the scheduled context item.");
    });
  });

  workspace.actions.filter((action) => action.status !== "cancelled").forEach((action) => {
    const id = `action:${action.id}`;
    addNode({ id, kind: "action", label: action.title, detail: compact(action.notes || "A concrete next step connected to saved context."), entityKind: "action", entityId: action.id, status: action.status, createdAt: action.createdAt });
    if (action.sourceItemId) addEdge(`item:${action.sourceItemId}`, id, "created_action", "This action was created from the linked saved item.");
    if (action.sourceCaptureId) addEdge(`capture:${action.sourceCaptureId}`, id, "created_action", "This action was created directly from the original capture.");
    if (action.outcome) {
      const outcomeId = `action-outcome:${action.id}`;
      addNode({ id: outcomeId, kind: "outcome", label: compact(action.outcome, 110), detail: "The outcome recorded when this action was completed.", entityKind: "synthetic", status: "observed", createdAt: action.completedAt });
      addEdge(id, outcomeId, "resulted_in", "Completing this action produced the recorded outcome.");
    }
  });

  workspace.items.filter((item) => !item.archivedAt).forEach((item) => {
    (item.capsuleSourceIds ?? []).forEach((sourceId) => {
      const sourceNodeId = nodeMap.has(`item:${sourceId}`) ? `item:${sourceId}` : nodeMap.has(`capture:${sourceId}`) ? `capture:${sourceId}` : nodeMap.has(`action:${sourceId}`) ? `action:${sourceId}` : null;
      if (sourceNodeId) addEdge(sourceNodeId, `item:${item.id}`, "contains", "This source is attached to the scheduled context item.");
    });
  });

  const edges = [...edgeMap.values()];
  const nodes = [...nodeMap.values()].map((node) => {
    if (node.kind !== "decision" || node.entityKind !== "item") return node;
    const itemId = node.entityId;
    const incomingEvidence = edges.some((edge) => edge.target === node.id && (edge.relationship === "informed" || edge.relationship === "supports"));
    const assumptions = edges.some((edge) => edge.source === node.id && edge.relationship === "assumes");
    const action = edges.some((edge) => edge.source === node.id && edge.relationship === "created_action");
    const outcome = edges.some((edge) => edge.source === node.id && (edge.relationship === "expects" || edge.relationship === "resulted_in"));
    const actualOutcome = workspace.items.find((item) => item.id === itemId)?.decisionCalibration?.actualOutcome;
    const gaps = [
      !incomingEvidence && "No linked evidence",
      !assumptions && "No assumptions recorded",
      !action && "No linked action",
      !outcome && "No forecast recorded",
      !actualOutcome && "Outcome not recorded",
    ].filter((value): value is string => Boolean(value));
    return { ...node, gaps };
  });

  return {
    nodes,
    edges,
    summary: {
      decisions: nodes.filter((node) => node.kind === "decision").length,
      evidence: nodes.filter((node) => node.kind === "evidence").length,
      openLoops: nodes.filter((node) => node.kind === "decision" && (node.gaps?.length ?? 0) > 0).length,
      themes: nodes.filter((node) => node.kind === "theme").length,
    },
  };
}
