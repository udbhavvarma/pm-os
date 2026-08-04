import test from "node:test";
import assert from "node:assert/strict";
import { buildDemoWorkspace } from "../src/lib/demoWorkspace";
import { buildReadinessBrief } from "../src/lib/workspace";

test("guided workspace contains a complete evidence-to-outcome story", () => {
  const data = buildDemoWorkspace(new Date("2026-07-31T10:00:00Z").getTime());
  const ids = new Set([...data.captures, ...data.items, ...data.actions].map((entry) => entry.id));
  for (const action of data.actions) {
    if (action.sourceCaptureId) assert.ok(ids.has(action.sourceCaptureId));
    if (action.sourceItemId) assert.ok(ids.has(action.sourceItemId));
  }
  for (const item of data.items) for (const source of item.capsuleSourceIds ?? []) assert.ok(ids.has(source));
  assert.ok(data.items.some((item) => item.decisionCalibration));
  assert.ok(data.items.some((item) => item.webResearch?.sources.length));
  assert.ok(buildReadinessBrief(data).openLoopCount >= 3);
  assert.ok(data.captures.every((capture) => capture.processingSource === "sample"));
});
