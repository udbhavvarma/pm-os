import test from "node:test";
import assert from "node:assert/strict";
import { readLocalCache, writeLocalCache } from "../src/lib/db";

test("demo records and recovery points use tab storage; private workspaces use local storage", () => {
  const makeStorage = () => {
    const data = new Map<string, string>();
    return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
  };
  const localStorage = makeStorage();
  const sessionStorage = makeStorage();
  const before = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { value: { localStorage, sessionStorage }, configurable: true });
  try {
    writeLocalCache("workspace_demo", { title: "Demo" });
    writeLocalCache("workspace_recovery_demo", [{ title: "Recovery" }]);
    writeLocalCache("workspace_user123", { title: "Private" });
    assert.equal(localStorage.getItem("workspace_demo"), null);
    assert.equal(localStorage.getItem("workspace_recovery_demo"), null);
    assert.equal(sessionStorage.getItem("workspace_user123"), null);
    assert.deepEqual(readLocalCache("workspace_demo"), { title: "Demo" });
    assert.deepEqual(readLocalCache("workspace_user123"), { title: "Private" });
  } finally {
    if (before) Object.defineProperty(globalThis, "window", before);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
