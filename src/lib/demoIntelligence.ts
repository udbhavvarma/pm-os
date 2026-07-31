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
      actions: /follow up|need to|before|todo/i.test(input) ? [{ title: "Clarify the next owner and deadline" }] : [],
      themes: hasDecision ? ["decision", "product"] : ["evidence"], decisions: hasDecision ? ["A decision is implied but the success measure needs confirmation."] : [],
      confidence: hasDecision ? 84 : 76, uncertainties: input.length < 80 ? ["The capture is brief, so context may be missing."] : ["No explicit owner was named."], });
  }
  if (path.includes("/research")) {
    const query = String(body.query || "the selected topic");
    return json({ answer: `## What is current\nThe guided demo keeps research bounded to the question: **${query}**. Current evidence still favors explicit time-to-value, implementation ownership, and measurable outcomes.\n\n## Why it matters\nThis supports treating rollout risk as a product decision, not only a pricing objection.\n\n## Suggested next move\nValidate the assumption with the next three qualified accounts and record the outcome.`,
      sources: [{ title: "Sample enterprise onboarding report", url: "https://example.com/research/enterprise-onboarding", snippet: "A sample citation used only inside the guided workspace." }, { title: "Sample pricing research", url: "https://example.com/research/pricing", snippet: "A second sample source demonstrating provenance." }] });
  }
  if (path.includes("/status")) return json({ configured: true, mode: "guided-demo" });
  if (path.includes("/chat")) {
    const question = String(body.question || "");
    const message = /weekly|week as a whole/i.test(question) ? "The week moved from a price-first framing to an implementation-risk framing. Finish the economics model, confirm rollout capacity, and leave the deferred procurement summary outside today’s attention budget."
      : /tension|contradiction|disagree/i.test(question) ? "## Tensions worth noticing\nThe active pricing decision favors guided rollout, while one open action still frames the problem as discount analysis.\n\n## Evidence from my memory\nActivation is healthy after setup, and three deals stalled around annual terms.\n\n## One question to resolve\nIs rollout capacity sufficient to make implementation support the default offer?"
        : "Start with the economics model because it converts the pricing debate into a bounded decision. Confirm rollout capacity second. The procurement summary can wait without losing its source context.";
    return json({ message });
  }
  return json({ error: "This guided action is not available." }, 404);
}
