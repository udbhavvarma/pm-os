import test from "node:test";
import assert from "node:assert/strict";
import { demoIntelligenceResponse } from "../src/lib/demoIntelligence";
import { normalizeConfidence } from "../src/lib/intelligence";
import { consumeRateLimit } from "../src/lib/rateLimit";
import { withIntelligenceAccess } from "../src/lib/serverAuth";

test("demo capture processing exposes confidence and uncertainty", async () => {
  const response = await demoIntelligenceResponse({ path: "/api/intelligence/process-capture", init: { body: JSON.stringify({ input: "We need to decide whether guided rollout should replace the annual discount before Friday." }) } });
  const result = await response.json() as { confidence: number; uncertainties: string[]; suggestedType: string };
  assert.equal(result.suggestedType, "decision");
  assert.ok(result.confidence >= 80);
  assert.ok(result.uncertainties.length > 0);
});

test("rate limiting rejects requests after the configured budget", () => {
  const key = `test-${Date.now()}`;
  assert.equal(consumeRateLimit(key, 2).allowed, true);
  assert.equal(consumeRateLimit(key, 2).allowed, true);
  assert.equal(consumeRateLimit(key, 2).allowed, false);
});

test("confidence accepts model fractions but presents a percentage", () => {
  assert.equal(normalizeConfidence(0.8), 80);
  assert.equal(normalizeConfidence(84), 84);
  assert.equal(normalizeConfidence(140), 100);
});

test("same-origin guided demo requests reach intelligence without workspace authentication", async () => {
  const handler = withIntelligenceAccess(async (_request, user) => Response.json({ anonymous: user.isAnonymous }));
  const response = await handler(new Request("https://auxiliaire-os.vercel.app/api/intelligence/process-capture", {
    method: "POST",
    headers: {
      Origin: "https://auxiliaire-os.vercel.app",
      "X-Auxiliaire-Demo": "live-intelligence",
      "X-Forwarded-For": `test-${Date.now()}`,
    },
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { anonymous: true });
});

test("cross-origin callers cannot claim guided demo intelligence access", async () => {
  const handler = withIntelligenceAccess(async () => Response.json({ accepted: true }));
  const response = await handler(new Request("https://auxiliaire-os.vercel.app/api/intelligence/process-capture", {
    method: "POST",
    headers: { Origin: "https://example.com", "X-Auxiliaire-Demo": "live-intelligence" },
  }));
  assert.equal(response.status, 401);
});

test("guided demo origin validation respects the forwarded public host", async () => {
  const handler = withIntelligenceAccess(async (_request, user) => Response.json({ anonymous: user.isAnonymous }));
  const response = await handler(new Request("http://localhost:3002/api/intelligence/process-capture", {
    method: "POST",
    headers: {
      Origin: "http://127.0.0.1:3002",
      Host: "127.0.0.1:3002",
      "X-Auxiliaire-Demo": "live-intelligence",
      "X-Forwarded-For": `forwarded-test-${Date.now()}`,
    },
  }));
  assert.equal(response.status, 200);
});
