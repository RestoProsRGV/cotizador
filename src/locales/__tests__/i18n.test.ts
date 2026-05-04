import { describe, it, expect } from "vitest";
import en from "../en.json";
import es from "../es.json";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      return flattenKeys(v as Record<string, unknown>, key);
    }
    return [key];
  });
}

describe("es.json key parity with en.json", () => {
  const enKeys = flattenKeys(en as unknown as Record<string, unknown>);
  const esKeys = flattenKeys(es as unknown as Record<string, unknown>);

  it("es.json has no missing keys", () => {
    const missing = enKeys.filter(k => !esKeys.includes(k));
    expect(missing, `Missing keys in es.json: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("es.json has no extra keys not in en.json", () => {
    const extra = esKeys.filter(k => !enKeys.includes(k));
    expect(extra, `Extra keys in es.json not in en.json: ${extra.join(", ")}`).toHaveLength(0);
  });

  it("all values in es.json are non-empty strings", () => {
    const empty = esKeys.filter(k => {
      const parts = k.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let val: any = es;
      for (const p of parts) val = val?.[p];
      return typeof val !== "string" || val.trim() === "";
    });
    expect(empty, `Empty values in es.json: ${empty.join(", ")}`).toHaveLength(0);
  });
});
