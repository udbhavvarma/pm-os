import test from "node:test";
import assert from "node:assert/strict";
import { prepareActionProposals } from "../src/lib/actionProposals";
import type { Action } from "../src/lib/workspace";

test("proposals skip repeated extraction from the same source", () => {
  const existing = [{ sourceItemId: "note", title: "Check pricing", status: "done" }] as Action[];
  assert.deepEqual(prepareActionProposals([{ title: " CHECK   pricing " }, { title: "Talk to sales" }, { title: "Talk to sales" }], existing, "note"), [{ title: "Talk to sales", dueAt: undefined }]);
  assert.equal(prepareActionProposals([{ title: "Check pricing" }], existing, "other-note").length, 1);
});

test("malformed and empty model suggestions cannot become actions", () => {
  assert.deepEqual(prepareActionProposals(null, [], "note"), []);
  assert.deepEqual(prepareActionProposals([null, {}, { title: " " }, { title: 42 }], [], "note"), []);
  assert.equal(prepareActionProposals([{ title: "Follow up", dueAt: "tomorrow" }], [], "note")[0].dueAt, undefined);
});
