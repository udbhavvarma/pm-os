import test from "node:test";
import assert from "node:assert/strict";
import { remotePatch } from "../src/lib/workspacePersistence";

test("clearing due dates, deferrals and completion persists as a field deletion", () => {
  const removed = Symbol("deleteField");
  const patch = remotePatch({ title: "Follow up", dueAt: undefined, deferredUntil: undefined, completedAt: undefined }, () => removed);
  assert.equal(patch.title, "Follow up");
  assert.equal(patch.dueAt, removed);
  assert.equal(patch.deferredUntil, removed);
  assert.equal(patch.completedAt, removed);
  assert.equal("notes" in patch, false);
});

test("partial writes preserve false, zero, null, and nested JSON values", () => {
  assert.deepEqual(remotePatch({ keepCurrent: false, snoozeCount: 0, note: null, tags: ["pricing"] }, () => "delete"), {
    keepCurrent: false, snoozeCount: 0, note: null, tags: ["pricing"],
  });
});
