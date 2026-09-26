import test from "node:test";
import assert from "node:assert/strict";
import { parseWorkspaceBackup } from "../src/lib/workspaceBackup";
import { buildDemoWorkspace } from "../src/lib/demoWorkspace";

test("version 2 backups preserve data while rebinding ownership", () => {
  const data = buildDemoWorkspace();
  const imported = parseWorkspaceBackup(JSON.stringify({ version: 2, data, audio: [] }), "new-owner");
  assert.equal(imported.data.captures.length, data.captures.length);
  assert.equal(imported.data.items.length, data.items.length);
  for (const records of Object.values(imported.data)) for (const record of records) assert.equal(record.userId, "new-owner");
  assert.ok(imported.data.activities.every(activity => !activity.reversible));
});

test("legacy records-only backups remain importable", () => {
  const data = buildDemoWorkspace();
  assert.equal(parseWorkspaceBackup(JSON.stringify(data), "owner").data.items.length, data.items.length);
});

test("malformed backups are rejected before persistence", () => {
  for (const value of [null, [], { version: 99 }, { captures: [null], items: [], actions: [] }]) {
    assert.throws(() => parseWorkspaceBackup(JSON.stringify(value), "owner"));
  }
  const data = buildDemoWorkspace();
  data.items[0].id = "../foreign";
  assert.throws(() => parseWorkspaceBackup(JSON.stringify({ data }), "owner"));
});

test("duplicate IDs, invalid dates and corrupt audio are rejected", () => {
  const data = buildDemoWorkspace();
  data.actions.push(data.actions[0]);
  assert.throws(() => parseWorkspaceBackup(JSON.stringify({ data }), "owner"));
  const valid = buildDemoWorkspace();
  assert.throws(() => parseWorkspaceBackup(JSON.stringify({ data: valid, audio: [{ sourceUrl: "indexeddb:test", mimeType: "audio/webm", base64: "broken!" }] }), "owner"));
  valid.actions[0].dueAt = -1;
  assert.throws(() => parseWorkspaceBackup(JSON.stringify({ data: valid }), "owner"));
});
