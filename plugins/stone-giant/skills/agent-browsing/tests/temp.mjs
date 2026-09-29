// A temp folder that is removed when the calling test file finishes.
import { after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const made = [];
after(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

export function tempDir() {
  const d = mkdtempSync(path.join(tmpdir(), "ab-"));
  made.push(d);
  return d;
}
