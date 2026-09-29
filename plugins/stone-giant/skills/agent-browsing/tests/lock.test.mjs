import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { takeLock } from "../scripts/lib/lock.mjs";
import { tempDir } from "./temp.mjs";

const lockUrl = new URL("../scripts/lib/lock.mjs", import.meta.url).href;

// Each contender tries once, and holds what it gets for 150 ms.
const contend = (file) => new Promise((resolve) => {
  const code = `import(${JSON.stringify(lockUrl)}).then(({ takeLock }) => {
    const release = takeLock(${JSON.stringify(file)});
    if (!release) { console.log("null"); return; }
    const from = Date.now();
    const until = from + 150;
    while (Date.now() < until) { /* hold */ }
    console.log(JSON.stringify([from, Date.now()]));
    release();
  });`;
  let out = "";
  const child = spawn(process.execPath, ["--input-type=module", "-e", code]);
  child.stdout.on("data", (d) => { out += d; });
  child.on("exit", () => resolve(out.trim() === "null" ? null : JSON.parse(out)));
});

test("ten processes racing to take over a dead holder's lock: never two holders at once", async () => {
  for (let round = 0; round < 5; round++) {
    const dir = tempDir();
    const file = path.join(dir, "race.lock");
    writeFileSync(file, "999999999"); // a holder that no longer exists
    const holds = (await Promise.all(Array.from({ length: 10 }, () => contend(file)))).filter(Boolean);
    assert.ok(holds.length >= 1, "someone took it over");
    holds.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < holds.length; i++) assert.ok(holds[i][0] >= holds[i - 1][1], `overlapping holds: ${JSON.stringify(holds)}`);
    assert.deepEqual(readdirSync(dir), [], "no lock, guard or staging file left");
  }
});

test("held() says whether the lock still names this process", () => {
  const file = path.join(tempDir(), "locks", "x.lock");
  mkdirSync(path.dirname(file), { recursive: true });
  const release = takeLock(file, { pid: 4242 });
  assert.equal(release.held(), true);
  writeFileSync(file, "5151"); // taken over
  assert.equal(release.held(), false);
  release();
  assert.deepEqual(readdirSync(path.dirname(file)), ["x.lock"], "someone else's lock is left alone");
});
