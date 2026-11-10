import test from "node:test";
import assert from "node:assert/strict";
import { NetworkRequestError, requestWithRetry } from "../src/lib/requestRetry";

test("network interruptions retry automatically before succeeding", async () => {
  let calls = 0;
  const response = await requestWithRetry(async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }, { sleep: async () => {} });

  assert.equal(calls, 2);
  assert.equal(response.status, 200);
});

test("temporary server failures retry but validation failures do not", async () => {
  let temporaryCalls = 0;
  const recovered = await requestWithRetry(async () => {
    temporaryCalls += 1;
    return new Response(null, { status: temporaryCalls === 1 ? 503 : 200 });
  }, { sleep: async () => {} });
  assert.equal(recovered.status, 200);
  assert.equal(temporaryCalls, 2);

  let validationCalls = 0;
  const validation = await requestWithRetry(async () => {
    validationCalls += 1;
    return new Response(null, { status: 400 });
  }, { sleep: async () => {} });
  assert.equal(validation.status, 400);
  assert.equal(validationCalls, 1);
});

test("exhausted network retries return a useful saved-recording message", async () => {
  await assert.rejects(
    requestWithRetry(async () => { throw new TypeError("Failed to fetch"); }, { attempts: 2, sleep: async () => {} }),
    (error: unknown) => error instanceof NetworkRequestError && /recording is saved/i.test(error.message),
  );
});
