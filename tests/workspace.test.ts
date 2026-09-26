import test from "node:test";
import assert from "node:assert/strict";
import { buildReadinessBrief, emptyWorkspace, rankActions, searchWorkspaceMemory, type Action } from "../src/lib/workspace";

const now = new Date("2026-07-31T10:00:00Z").getTime();
const action = (input: Partial<Action> & Pick<Action, "id" | "title">): Action => ({ userId: "test", status: "open", priority: "normal", createdAt: now - 86_400_000, updatedAt: now, ...input });

test("ranking explains urgency and excludes deferred work", () => {
  const ranked = rankActions([
    action({ id: "normal", title: "Normal" }),
    action({ id: "urgent", title: "Urgent", priority: "high", dueAt: now - 1 }),
    action({ id: "deferred", title: "Deferred", deferredUntil: now + 86_400_000 }),
  ], now);
  assert.equal(ranked[0].action.id, "urgent");
  assert.deepEqual(ranked[0].reasons.slice(0, 2), ["high priority", "overdue"]);
  assert.equal(ranked.some((entry) => entry.action.id === "deferred"), false);
});

test("readiness counts open loops even when one is deliberately deferred", () => {
  const data = emptyWorkspace();
  data.actions = [action({ id: "a", title: "A" }), action({ id: "b", title: "B", deferredUntil: now + 86_400_000 })];
  const brief = buildReadinessBrief(data, now);
  assert.equal(brief.openLoopCount, 2);
  assert.equal(brief.focus?.id, "a");
});

test("memory search returns source material across object types", () => {
  const data = emptyWorkspace();
  data.actions = [action({ id: "a", title: "Model enterprise pricing", notes: "Annual plan economics" })];
  const results = searchWorkspaceMemory(data, "enterprise pricing");
  assert.equal(results[0]?.id, "a");
  assert.ok(results[0]?.score > 0);
});

test("memory search supports Hindi and Japanese without returning unrelated records", () => {
  const data = emptyWorkspace();
  data.actions = [action({ id: "hi", title: "ग्राहक अनुसंधान" }), action({ id: "ja", title: "価格戦略" }), action({ id: "en", title: "Unrelated" })];
  assert.deepEqual(searchWorkspaceMemory(data, "ग्राहक").map(entry => entry.id), ["hi"]);
  assert.deepEqual(searchWorkspaceMemory(data, "価格").map(entry => entry.id), ["ja"]);
  assert.deepEqual(searchWorkspaceMemory(data, "?!"), []);
});
