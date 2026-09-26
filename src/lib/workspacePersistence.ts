/** Preserve explicit field removals when sending a partial record to Firestore. */
export function remotePatch(value: Record<string, unknown>, removeField: () => unknown): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).map(([key, field]) => [
    key, field === undefined ? removeField() : JSON.parse(JSON.stringify(field)),
  ]));
}
