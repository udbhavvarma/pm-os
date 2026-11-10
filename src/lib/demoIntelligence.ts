interface DemoRequest { path: string; init?: RequestInit }

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json", "X-Auxiliaire-Demo": "true" } });

function requestBody(init?: RequestInit) {
  if (typeof init?.body !== "string") return {} as Record<string, unknown>;
  try { return JSON.parse(init.body) as Record<string, unknown>; }
  catch { return {} as Record<string, unknown>; }
}

export async function demoIntelligenceResponse({ path, init }: DemoRequest): Promise<Response> {
  const body = requestBody(init);
  if (path.includes("/transcribe")) return json({ transcript: "Customer interviews suggest implementation risk is a stronger enterprise objection than price. Follow up with Priya about rollout capacity before Friday." });
  if (path.includes("/process-capture")) {
    const input = String(body.input || "").trim();
    const firstLine = input.split(/[.!?\n]/)[0]?.trim() || "New product evidence";
    const hasDecision = /decid|choose|option|whether|pricing|approve/i.test(input);
    return json({ title: firstLine.slice(0, 68), summary: input.length > 180 ? `${input.slice(0, 177)}…` : input,
      suggestedType: hasDecision ? "decision" : /^https?:/i.test(input) ? "knowledge" : "note",
      actions: /follow up|need to|before|todo/i.test(input) ? [{ title: "Assign an owner and due date" }] : [],
      themes: hasDecision ? ["decision", "product"] : ["evidence"], decisions: hasDecision ? ["A decision is implied but the success measure needs confirmation."] : [],
      assumptions: hasDecision ? ["The proposed choice will improve the intended product outcome."] : [],
      confidence: hasDecision ? 84 : 76, uncertainties: input.length < 80 ? ["The capture is brief, so context may be missing."] : ["No explicit owner was named."], });
  }
  if (path.includes("/research")) {
    const query = String(body.query || "the selected topic");
    return json({ answer: `## Current evidence\nFor **${query}**, the sample sources emphasize measurable time-to-value, a named implementation owner, and explicit success criteria.\n\n## Effect on this item\nThe evidence supports testing rollout support before increasing the discount.\n\n## Gaps\nThe sample does not quantify implementation cost or team capacity.\n\n## Recommended action\nTest the offer with the next three qualified accounts and record the result.`,
      sources: [{ title: "Sample enterprise onboarding report", url: "https://example.com/research/enterprise-onboarding", snippet: "A sample citation used only inside the guided workspace." }, { title: "Sample pricing research", url: "https://example.com/research/pricing", snippet: "A second sample source demonstrating provenance." }] });
  }
  if (path.includes("/status")) return json({ configured: true, mode: "guided-demo" });
  if (path.includes("/chat")) {
    const question = String(body.question || "");
    const message = /weekly|week as a whole|weekly summary/i.test(question) ? "## Progress\nThe pricing decision now focuses on rollout risk instead of discount size.\n\n## Unresolved\nImplementation cost and team capacity are not confirmed.\n\n## Next week\nFinish the economics model, then confirm rollout capacity with Priya."
      : /tension|contradiction|disagree|conflict/i.test(question) ? "## Conflicting records\nThe saved decision favors guided rollout, but one open action still treats discount analysis as the main question.\n\n## Evidence\nActivation is healthy after setup, and three deals stalled around annual terms.\n\n## Question to resolve\nCan the team support guided implementation for three concurrent accounts?"
        : "Start with the economics model because it tests the cost of the current decision. Confirm rollout capacity second. The procurement summary can wait.";
    return json({ message });
  }
  return json({ error: "This guided action is not available." }, 404);
}
