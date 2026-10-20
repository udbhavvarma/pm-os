import test from "node:test";
import assert from "node:assert/strict";
import { prepareActionProposals, prepareCaptureAction } from "../src/lib/actionProposals";
import type { Action, Capture } from "../src/lib/workspace";

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

test('capture actions keep the selected deadline and cannot be added twice', () => {
  const capture = { id: 'capture-1', title: 'Meeting', rawContent: 'Meeting notes', suggestedActions: [{ title: 'First task', dueAt: 10 }, { title: 'Second task', dueAt: 20 }] } as Capture;
  assert.deepEqual(prepareCaptureAction(capture, 'Second task', []), { title: 'Second task', dueAt: 20 });
  assert.equal(prepareCaptureAction(capture, 'Second task', [{ sourceCaptureId: 'capture-1', title: ' second   TASK ', status: 'open' } as Action]), null);
  assert.ok(prepareCaptureAction(capture, 'Second task', [{ sourceCaptureId: 'different', title: 'Second task', status: 'open' } as Action]));
});

test('reviewed capture actions preserve edits and explicit deadline removal', () => {
  const capture = {id:'c1',rawContent:'Send the brief',suggestedActions:[{title:'Send brief',dueAt:999}]} as Capture;
  assert.deepEqual(prepareCaptureAction(capture,'Send brief',[],{title:'  Send revised brief  '}),{title:'Send revised brief',dueAt:undefined});
  assert.deepEqual(prepareCaptureAction(capture,'Send brief',[],{title:'Send revised brief',dueAt:1234}),{title:'Send revised brief',dueAt:1234});
  assert.equal(prepareCaptureAction(capture,'Send brief',[],{title:' '}),null);
  assert.equal(prepareCaptureAction(capture,'Send brief',[],{title:'Send brief',dueAt:NaN})?.dueAt,undefined);
});
test('editing a confirmed suggestion does not let the original be added again', () => {
  const capture = {id:'c1',rawContent:'Send brief',suggestedActions:[{title:'Send brief'}]} as Capture;
  const existing = [{sourceCaptureId:'c1',sourceSuggestionTitle:'Send brief',title:'Send revised brief',status:'open'}] as Action[];
  assert.equal(prepareCaptureAction(capture,'Send brief',existing,{title:'A second edit'}),null);
  assert.equal(prepareCaptureAction(capture,'Send brief',existing),null);
  assert.ok(prepareCaptureAction(capture,'Send brief',[{...existing[0],status:'cancelled'}]));
});
