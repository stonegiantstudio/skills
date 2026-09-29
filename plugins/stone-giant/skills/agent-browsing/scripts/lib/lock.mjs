// A lock file whose holder is a pid: one `cli.mjs open` per session, one
// `setup.mjs --link` at a time.
import { mkdirSync, linkSync, writeFileSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

const alive = (pid) => {
  try { process.kill(pid, 0); return true; } catch (err) { return err.code === "EPERM"; }
};

// Returns a release function, or null while a live process holds the lock.
// The pid is written to a file of our own first and hard-linked into place,
// so the lock never exists without its holder. A lock whose holder is gone,
// or that is older than any holder needs, is taken over; release removes the
// lock only while it still names us, and release.held() says whether it does,
// for a holder about to act on the lock after a slow step.
export function takeLock(file, { pid = process.pid, isAlive = alive, now = Date.now, staleMs = 120_000 } = {}) {
  mkdirSync(path.dirname(file), { recursive: true });
  const mine = `${file}.${pid}.${randomBytes(4).toString("hex")}`;
  writeFileSync(mine, String(pid));
  const guard = `${file}.takeover`;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        linkSync(mine, file);
        const held = () => {
          try { return readFileSync(file, "utf8") === String(pid); } catch { return false; }
        };
        const release = () => { if (held()) { try { unlinkSync(file); } catch { /* already gone */ } } };
        release.held = held;
        return release;
      } catch (err) {
        if (err.code !== "EEXIST") throw err;
        let stale;
        try { stale = readFileSync(file, "utf8"); } catch { continue; /* just released */ }
        if (!isStale(file, stale, { isAlive, now, staleMs })) return null;
        // Taking over is itself one process at a time, through a guard file,
        // so two contenders can never both remove the stale lock and each hold
        // a fresh one. A guard left by a process that died is removed after a
        // few seconds.
        try { linkSync(mine, guard); } catch (guardErr) {
          if (guardErr.code !== "EEXIST") throw guardErr;
          try { if (now() - statSync(guard).mtimeMs > 10_000) unlinkSync(guard); } catch { /* gone */ }
          continue;
        }
        try {
          let current = null;
          try { current = readFileSync(file, "utf8"); } catch { /* gone */ }
          if (current === stale) unlinkSync(file);
        } finally {
          try { unlinkSync(guard); } catch { /* gone */ }
        }
      }
    }
    return null;
  } finally {
    try { unlinkSync(mine); } catch { /* never written */ }
  }
}

function isStale(file, holderText, { isAlive, now, staleMs }) {
  const holder = Number(holderText);
  let age = Infinity;
  try { age = now() - statSync(file).mtimeMs; } catch { /* gone: nothing to hold */ }
  return !(Number.isInteger(holder) && holder > 0 && isAlive(holder) && age < staleMs);
}

// takeLock, retried until it is free or waitMs has passed. For callers that
// only ever hold a lock for a moment.
export function waitForLock(file, waitMs, options) {
  const until = Date.now() + waitMs;
  const nap = new Int32Array(new SharedArrayBuffer(4));
  for (;;) {
    const release = takeLock(file, options);
    if (release || Date.now() > until) return release;
    Atomics.wait(nap, 0, 0, 50);
  }
}
