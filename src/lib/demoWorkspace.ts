import { dayId, type WorkspaceData } from "@/lib/workspace";

const days = (count: number) => count * 86_400_000;

export function buildDemoWorkspace(now = Date.now()): WorkspaceData {
  return {
    captures: [
      {
        id: "demo_capture_pricing", userId: "demo", inputType: "text",
        rawContent: "Pricing review: activation is healthy, but three teams stalled when procurement asked for annual terms. Need to compare a 15% annual discount against implementation cost before Friday. Priya thinks enterprise buyers value a guided rollout more than a lower sticker price.",
        title: "Pricing review notes",
        transcript: "Pricing review: activation is healthy, but three teams stalled when procurement asked for annual terms. Need to compare a 15% annual discount against implementation cost before Friday.",
        aiSummary: "Enterprise demand is present, but annual terms and rollout support are blocking conversion. The decision is whether to lead with a discount or a guided implementation package.",
        aiThemes: ["pricing", "enterprise", "activation"], aiDecisions: ["Choose the annual enterprise offer"], suggestedType: "decision",
        suggestedActions: [{ title: "Model annual-plan economics", dueAt: now + days(1) }],
        processingStatus: "ready", processedAt: now - days(1), aiConfidence: 88,
        aiUncertainties: ["Implementation cost is not quantified in the note."],
        status: "processed", createdAt: now - days(2), updatedAt: now - days(1),
      },
      {
        id: "demo_capture_interviews", userId: "demo", inputType: "link",
        rawContent: "https://example.com/research/enterprise-onboarding", title: "Enterprise onboarding research",
        aiSummary: "A reference on reducing time-to-value during enterprise onboarding.", aiThemes: ["onboarding", "enterprise"],
        suggestedType: "knowledge", suggestedActions: [], processingStatus: "ready", processedAt: now - days(3), aiConfidence: 82,
        status: "processed", createdAt: now - days(4), updatedAt: now - days(3),
      },
    ],
    items: [
      {
        id: "demo_decision_pricing", userId: "demo", type: "decision", title: "Lead enterprise annual plans with guided rollout",
        content: "Offer a guided 30-day implementation package before using a blanket annual discount. Evidence: three procurement stalls, healthy activation after setup, and interview feedback that rollout risk matters more than sticker price.",
        summary: "Test implementation support as the primary enterprise lever; keep a smaller discount as the fallback.",
        sourceCaptureId: "demo_capture_pricing", tags: ["pricing", "enterprise"], reviewAt: now - 3_600_000,
        decisionCalibration: { expectedOutcome: "At least two of the next three qualified enterprise accounts accept annual terms when guided rollout is included.", assumptions: ["Setup risk is a stronger objection than price", "The team can support three guided rollouts"], confidence: 70, reviewAt: now - 3_600_000 },
        createdAt: now - days(12), updatedAt: now - days(2),
      },
      {
        id: "demo_knowledge_onboarding", userId: "demo", type: "knowledge", title: "Enterprise onboarding: reducing time-to-value",
        content: "Successful enterprise onboarding programs define one measurable first outcome, an accountable internal owner, and a short implementation sequence.",
        summary: "The first proof of value should be explicit, owned, and reached quickly.", sourceCaptureId: "demo_capture_interviews",
        tags: ["onboarding", "enterprise"], keepCurrent: true, refreshEveryDays: 30, nextResearchAt: now + days(21),
        webResearch: { query: "Current enterprise onboarding practices", answer: "Recent guidance continues to emphasize measurable time-to-value, shared implementation ownership, and risk reduction before expansion.", researchedAt: now - days(9), sources: [{ title: "Example product-led onboarding report", url: "https://example.com/research/enterprise-onboarding", snippet: "A sample citation in this guided workspace." }] },
        createdAt: now - days(18), updatedAt: now - days(9),
      },
      {
        id: "demo_capsule_review", userId: "demo", type: "capsule", title: "Context for Friday’s pricing review",
        content: "Do not collapse this into a discount discussion. Revisit the original evidence: activation is healthy after setup, procurement is asking for annual terms, and implementation risk may be the real objection.",
        summary: "Return to the evidence before changing the price.", tags: ["future-context"], capsuleDeliverAt: now + days(2),
        capsuleSourceIds: ["demo_decision_pricing", "demo_knowledge_onboarding", "demo_action_model"], reviewAt: now + days(2),
        createdAt: now - days(1), updatedAt: now - days(1),
      },
    ],
    actions: [
      { id: "demo_action_model", userId: "demo", title: "Model annual-plan economics", notes: "Compare 15% discount with the cost of a guided 30-day rollout.", sourceItemId: "demo_decision_pricing", status: "open", priority: "high", dueAt: now + days(1), createdAt: now - days(2), updatedAt: now - days(1) },
      { id: "demo_action_priya", userId: "demo", title: "Validate rollout capacity with Priya", notes: "Confirm whether the team can support three concurrent enterprise implementations.", sourceCaptureId: "demo_capture_pricing", status: "open", priority: "normal", dueAt: now + days(2), createdAt: now - days(2), updatedAt: now - days(2) },
      { id: "demo_action_interviews", userId: "demo", title: "Summarize the three procurement stalls", notes: "Separate price objections from implementation-risk objections.", sourceItemId: "demo_decision_pricing", status: "open", priority: "normal", snoozeCount: 2, createdAt: now - days(10), updatedAt: now - days(2) },
      { id: "demo_action_complete", userId: "demo", title: "Review activation data by account", status: "done", priority: "normal", createdAt: now - days(5), updatedAt: now - days(1), completedAt: now - days(1) },
    ],
    dailyStates: [
      { id: dayId(new Date(now)), userId: "demo", focusActionId: "demo_action_model", attentionCapacity: 3,
        aiGuidance: "Start with the economics model. It turns the pricing discussion into a decision with boundaries. The Priya check can happen next; the procurement summary is useful, but it should not delay the model.", aiGuidanceAt: now - 1_800_000,
        changeReport: "## What moved\nThe conversation shifted from discount size to implementation risk.\n\n## Recommended adjustment\nTest guided rollout as the primary offer and keep discounting as a bounded fallback.", changeReportAt: now - 1_800_000, updatedAt: now - 1_800_000 },
    ],
    activities: [
      { id: "demo_activity_1", userId: "demo", type: "completed", entityType: "action", entityId: "demo_action_complete", label: "Completed “Review activation data by account”", reversible: false, createdAt: now - days(1) },
      { id: "demo_activity_2", userId: "demo", type: "created", entityType: "item", entityId: "demo_capsule_review", label: "Sealed context for Friday’s pricing review", reversible: false, createdAt: now - days(1) },
    ],
  };
}
