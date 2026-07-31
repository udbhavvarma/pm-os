import test from "node:test";
import assert from "node:assert/strict";
import { demoIntelligenceResponse } from "../src/lib/demoIntelligence";
import { normalizeConfidence } from "../src/lib/intelligence";
import { consumeRateLimit } from "../src/lib/rateLimit";

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
