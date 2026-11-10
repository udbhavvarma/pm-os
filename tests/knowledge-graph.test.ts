import test from "node:test";
import assert from "node:assert/strict";
import { buildDemoWorkspace } from "../src/lib/demoWorkspace";
import { buildKnowledgeGraph } from "../src/lib/knowledgeGraph";
import { emptyWorkspace } from "../src/lib/workspace";

test("knowledge graph connects evidence, decisions, assumptions, actions, forecasts, and capsules", () => {
  const graph = buildKnowledgeGraph(buildDemoWorkspace(new Date("2026-07-31T10:00:00Z").getTime()));
  const decisionId = "item:demo_decision_pricing";

  assert.ok(graph.nodes.some((node) => node.id === "capture:demo_capture_pricing" && node.kind === "evidence"));
  assert.ok(graph.nodes.some((node) => node.id === decisionId && node.kind === "decision"));
  assert.equal(graph.nodes.some((node) => node.id.startsWith("proposal:demo_capture_pricing")), false);
  assert.ok(graph.edges.some((edge) => edge.source === "capture:demo_capture_pricing" && edge.target === decisionId && edge.relationship === "informed"));
  assert.ok(graph.edges.some((edge) => edge.source === decisionId && edge.relationship === "assumes"));
  assert.ok(graph.edges.some((edge) => edge.source === decisionId && edge.target === "action:demo_action_model" && edge.relationship === "created_action"));
  assert.ok(graph.edges.some((edge) => edge.source === decisionId && edge.relationship === "expects"));
  assert.ok(graph.edges.some((edge) => edge.source === "action:demo_action_model" && edge.target === "item:demo_capsule_review" && edge.relationship === "contains"));
  assert.ok(graph.summary.themes >= 3);
});

test("knowledge graph identifies missing decision context", () => {
  const workspace = emptyWorkspace();
  workspace.items = [{
    id: "decision",
    userId: "test",
    type: "decision",
    title: "Ship the experiment",
    content: "Proceed with the experiment.",
    tags: [],
    createdAt: 1,
    updatedAt: 1,
  }];

  const graph = buildKnowledgeGraph(workspace);
  const decision = graph.nodes.find((node) => node.id === "item:decision");
  assert.deepEqual(decision?.gaps, ["No linked evidence", "No assumptions recorded", "No linked action", "No forecast recorded", "Outcome not recorded"]);
  assert.equal(graph.summary.openLoops, 1);
});
