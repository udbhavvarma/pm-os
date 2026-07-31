import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

interface Fixture {
  name: string;
  input: string;
  expectedType: string;
  expectsAction: boolean;
  requiredTheme: string;
}

async function main() {
  const fixtures = JSON.parse(await readFile(join(process.cwd(), "evals/capture-fixtures.json"), "utf8")) as Fixture[];
  const { GroqProvider } = await import("../src/lib/intelligence");
  const provider = new GroqProvider();

  if (!await provider.isAvailable()) {
    console.error("GROQ_API_KEY is required for capture evaluations.");
    process.exitCode = 1;
    return;
  }

  let passed = 0;
  for (const fixture of fixtures) {
    const result = await provider.processCapture(fixture.input);
    const checks = [
      result.suggestedType === fixture.expectedType,
      fixture.expectsAction ? result.actions.length > 0 : true,
      result.themes.some((theme) => theme.toLowerCase().includes(fixture.requiredTheme)),
      result.confidence > 1 && result.confidence <= 100,
    ];
    const ok = checks.every(Boolean);
    if (ok) passed += 1;
    console.log(`${ok ? "PASS" : "FAIL"} ${fixture.name}`, { type: result.suggestedType, actions: result.actions.length, themes: result.themes, confidence: result.confidence });
  }
  console.log(`${passed}/${fixtures.length} capture fixtures passed.`);
  if (passed !== fixtures.length) process.exitCode = 1;
}

void main();
