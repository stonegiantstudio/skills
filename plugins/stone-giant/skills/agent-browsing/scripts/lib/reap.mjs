// Stop the given orphans. Every signal is preceded by recheck(p), which must
// re-prove that the pid is still the same process and still an abandoned agent
// browser (see sameOrphan in processes.mjs): a pid can be reused while we wait.
// Signals go to all first and the wait happens once, so a long list cannot
// outrun a hook's time limit.
export async function reapOrphans(targets, { recheck, kill, sleep, graceMs = 5000, now = Date.now }) {
  const signalled = [];
  const skipped = [];
  for (const p of targets) {
    if (!recheck(p)) { skipped.push({ ...p, reason: "it changed since it was read" }); continue; }
    try { kill(p.pid, "SIGTERM"); signalled.push(p); }
    catch (err) { skipped.push({ ...p, reason: `the signal failed (${err.code ?? err.message})` }); }
  }
  // Wall time, not a count of naps: each recheck runs ps, which takes time of its own.
  const until = now() + graceMs;
  while (now() < until && signalled.some((p) => recheck(p))) await sleep(100);
  for (const p of signalled) {
    if (recheck(p)) { try { kill(p.pid, "SIGKILL"); } catch { /* exited between the check and the signal */ } }
  }
  return { stopped: signalled, skipped };
}
