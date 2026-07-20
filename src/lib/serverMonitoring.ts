/** Minimal product-health logging. No analytics or external forwarding. */
export async function logServerError(input: {
  route: string;
  status: number;
  reason: "uncaught" | "handler_5xx";
  message?: string;
}): Promise<void> {
  console.error("[processing_failure]", JSON.stringify({
    operation: input.route.slice(0, 100),
    status: input.status,
    reason: input.reason,
    message: input.message?.slice(0, 200) ?? "",
    createdAt: new Date().toISOString(),
  }));
}
