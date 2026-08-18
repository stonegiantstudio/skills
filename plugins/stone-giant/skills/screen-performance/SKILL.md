---
description: Make a slow app screen feel like a native desktop app. Use when a screen is slow or laggy, when a loader or payload is too heavy, when list-heavy UI (gantts, long tables, dashboards) janks, or when navigations refetch data they already have. A measure-first loop with hard budgets plus ten patterns ranked by leverage (serial loader waves -> batched round trips -> N+1 -> payload projection -> client-derivable data -> revalidation tax -> per-item listeners -> virtualization -> optimistic UI -> pending feedback). For general React Router v7 route, loader, and mutation patterns, use the react-router-v7 skill.
---

# Screen performance

A slow screen is almost never one problem. It is a stack of them — a
loader that serializes queries it could parallelize, a payload full of
fields nobody renders, a router quietly re-downloading data on every
navigation, a listener per row — and each one hides behind the others.
The reflex is to grab the profiler, find "React is slow", and memoize
things at random. That changes nothing, because the bottleneck was never
where the reflex pointed.

This skill is a **measure-first** loop: capture numbers, fix the one
highest-leverage thing, re-measure, commit with both numbers, repeat.
On the reference overhaul (a ~400-row gantt screen) this took the loader
from 4.4s to 0.7s, the SSR document from 3.6MB to 1.2MB, and every
post-load interaction to under 100ms with zero network — and measuring
first reversed the plan twice: a query-hint "fix" turned out to make
every load 3x slower, and a suspected geometry bug measured at 2px, not
worth touching. Assumptions get measured before they get fixed.

## Budgets

Three tiers, in three environments — don't mix them (the traps section
explains why dev wall-clock lies).

**Structural — measurable on a warm dev server**; these transfer between
builds:

- Loader data fetch: **under 300KB decoded**, with no serial loader
  waves and no N+1.
- Every post-load interaction — expand, zoom, hover, tab switch, client
  filter — **zero network**.
- Anything that must stay slower than ~300ms shows pending state (dim +
  spinner driven by the router's navigation state).

**Wall-clock — production or preview builds:**

- Loader data fetch: **under 1s median** (median of runs 2–4, first run
  discarded, HTTP cache disabled). A warm dev server is a usable proxy
  for loader latency — it is network- and query-bound — but confirm on a
  production build before claiming the win.
- Every post-load interaction **under 100ms**.

**User-facing gate — field data, not a lab trace:**

- **LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1** at the **75th percentile of
  real sessions** — that is how the Core Web Vitals "good" thresholds
  are defined. A lab or preview run can falsify (if it misses, the field
  will too) but cannot certify; keep field vitals flowing (an APM's
  browser tracing, or the `web-vitals` package reporting into your
  analytics) and gate on p75. CLS deserves a deliberate check on screens
  with virtualization or late-arriving affordances — estimated row
  heights and popped-in links are exactly what shifts layout.

Every interaction is either under budget or listed with its measured
number and the reason it stays.

## The loop

1. **Baseline.** Capture loader latency and size, document size, DOM
   count, and what each interaction fetches (snippets below). These are
   the "before" column of the PR.
2. **Pick the highest-leverage smell** from the patterns below.
3. **Fix that one thing.** Nothing else rides along.
4. **Re-measure the same numbers.** A gain inside run-to-run noise
   (±10%) is not a gain; revert it or keep it only on non-perf grounds.
5. **Test, then commit with before → after in the message.**
6. **Guard the win.** A measured gain with no pin regresses silently:
   add a shape test for the payload projection, a contract test for the
   listener/revalidation behavior you fixed (mutation-check it — revert
   the production line, see red, restore), keep field Web Vitals flowing
   (e.g. an APM's browser tracing), and record the CWV baseline in the
   PR body.
7. Repeat until the budgets hold. Ship the accumulated table in the PR
   body — measured on two preview deployments (with and without the
   branch, same database, same account and data — preview hosts don't
   share session cookies) when the platform offers them.

## Measurement snippets

```js
// Loader latency + payload (adjust the data-endpoint URL to your router).
// Failures must be loud: fetch resolves happily on 404s, 500s, and login
// redirects, and those bodies are smaller and faster — a broken endpoint
// would read as a win. Cache off, median of runs 2-4, decoded bytes
// (String.length counts UTF-16 units, not bytes; for wire size read
// transferSize off the resource timing entry instead).
async function t(u){const t0=performance.now();const r=await fetch(u,{cache:'no-store'});
  const b=await r.text();
  if(!r.ok||r.redirected)throw new Error(`not a clean 200: ${r.status}${r.redirected?' (redirected)':''}`);
  return{ms:Math.round(performance.now()-t0),kb:Math.round(new Blob([b]).size/1024)}}
const runs=[];for(let i=0;i<4;i++)runs.push(await t('/your/route.data'));
const ms=runs.slice(1).map(r=>r.ms).sort((a,b)=>a-b);
console.log({medianMs:ms[1],kb:runs[1].kb,runs})

// Document + DOM weight
const nav=performance.getEntriesByType('navigation')[0]
console.log({ttfb:nav.responseStart,docKB:nav.decodedBodySize/1024,
  domNodes:document.getElementsByTagName('*').length})

// Main-thread blocking — install BEFORE interacting. Long tasks only
// surface >=50ms chunks: silence means "not measured", not "under the
// 100ms interaction budget" — gate interactions on INP below.
try{new PerformanceObserver(l=>l.getEntries().forEach(e=>console.log('longtask',e.duration)))
  .observe({type:'longtask',buffered:true})}catch{/* longtask unsupported (Safari/Firefox) */}

// LCP + CLS — only after a REAL reload (see the buffered-observer trap)
new PerformanceObserver(l=>console.log('LCP',l.getEntries().at(-1)?.startTime))
  .observe({type:'largest-contentful-paint',buffered:true})
let cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())
  if(!e.hadRecentInput)cls+=e.value;console.log('CLS',cls)})
  .observe({type:'layout-shift',buffered:true})

// INP has no one-liner — use the web-vitals package:
//   import {onINP} from 'web-vitals'; onINP(console.log)
```

What an interaction actually fetches: the network panel filtered to the
router's data requests (in React Router v7, `.data` requests — the
`_routes=` param names exactly which loaders ran). Server-side query
timing: per-statement logs on the db layer if it has them; for SQL
variants, run each 2–3 times against a real database and compare.

## The patterns

Ranked roughly by leverage. Gains in parentheses are from the reference
overhaul.

1. **Serial loader waves that gate nothing.** For every `await` chain in
   a loader, open the callee and verify the passed value is actually
   used — all the way into the SQL text. The reference loader chained
   six queries behind an aggregate whose values every downstream
   function ignored ("kept for signature compatibility"). Fix: one
   `Promise.all`. (−500ms)
2. **One round trip per query.** N parallel queries pay N network round
   trips and compete for pool connections. Fix: batch plain SELECTs into
   one multi-recordset round trip, composing the statements from shared
   query-fragment builders so each SELECT keeps a single source of
   truth. (6 round trips → 1)
3. **N+1: `Promise.all(items.map(query))`.** Fix: one set-based query
   over the whole list. On SQL Server pass the list as a table-valued
   parameter — the `sql-server-performance` skill's TVP section is the
   canonical shape; TVPs replace CSV splitting and dynamic IN lists. A
   delimiter-split CSV param is defensible only when the keys can never
   contain the delimiter (a comma inside one key silently returns wrong
   rows — corruption, not injection). Prove result-equivalence first on
   real data: `EXCEPT` in both directions **plus grouped row counts**
   (`GROUP BY` the key, compare counts) — `EXCEPT` dedupes, so it stays
   empty even when the rewrite dropped duplicate rows, which is exactly
   the failure a batching rewrite produces. (7.3s → 0.5s)
4. **Shipping fields the screen never reads.** Grep the consuming
   components for actual field access, define a projection type, map to
   it server-side; keep the full shape only for the paths that need it.
   (payload −59%)
5. **Serializing what the client can derive.** If a payload field is a
   pure function of another payload field, ship only the input and
   derive at render time with memoized utils. The reference screen
   shipped one formatted string per day of a 20-year calendar ruler;
   two date bounds replaced all of it. (−200KB)
6. **Default revalidation — the silent data tax.** React Router (v7
   framework mode with single fetch; verified empirically on 7.15)
   revalidates every matched loader whenever the pathname changes, and
   `prefetch="intent"` prefetches loader data WITHOUT consulting
   `shouldRevalidate` — re-verify both against the router's release
   notes when the major or data-strategy changes. Expanding a row on the
   reference screen silently re-downloaded the whole dataset. Classify
   every navigation on the screen as data-changing or presentation-only,
   and opt the presentation-only ones out of revalidation in the route,
   its parents, AND root; drop `prefetch` where the data is already
   client-side. Post-action revalidation is a different economy — after
   a mutation, letting loaders re-run is what keeps views consistent;
   see the `react-router-v7` skill for the mechanics and that side of
   the trade. (a full dataset per row-expand → one tiny background
   request per expand)
7. **Per-item event listeners.** One `mousemove`/`scroll` listener per
   row — worse, attached to `document` — is a freeze factory. Fix: ONE
   rAF-throttled listener that writes to refs, never React state per
   event — delegated on the container for bubbling events
   (`mousemove`/`pointermove`), bound directly on the scrolling element
   for `scroll`, which does not bubble; attach tracking only while the
   affordance (tooltip, overlay) is open. (300 events: 2ms)
8. **Long lists without virtualization or memoization.** Virtualize
   (one virtualizer can drive two aligned panes, e.g. a rail and a
   grid), `React.memo` with primitive props, compute geometry once per
   (data, zoom) upstream instead of per item per render. Give
   special-height rows a real SSR size estimate or the first paint
   overlaps. (18k → 9.3k DOM nodes; hydration block 630ms → 64ms)
9. **Blocking UX where optimism is free.** If the data a panel needs is
   already in a parent payload, render it optimistically on click by
   reading the in-flight navigation, and let the route swap in
   transparently — with the panel owned by ONE component so the loader
   landing doesn't remount it mid-animation. Reserve layout slots for
   late-arriving affordances so nothing shifts.
10. **Missing pending feedback** on whatever legitimately stays slow. A
    screen that looks frozen gets reported as broken, whatever the
    number says.

## Traps that skew the measurements

- Dev-mode React inflates interaction costs enormously — a 45-second
  dev-server freeze measured 41ms in the production build. Confirm
  user-facing wins on production/preview builds; structural costs
  (payload, round trips, DOM size, listener counts) transfer between
  builds, wall-clock ratios don't.
- Vite HMR does not reload the root route module, and server module
  singletons survive HMR — restart the dev server after touching either,
  or you chase phantom `X is not defined` / missing-method errors.
- Buffered LCP/CLS observers lie when the tab did not actually reload —
  a same-URL "navigation" can leave you reading entries from the previous
  session (the reference overhaul caught a 28s phantom LCP this way). Force a real reload
  (cache-busting query) and check `performance.getEntriesByType('navigation')[0].type`.
- rAF and CSS animations pause in occluded or background tabs: under
  browser automation, a "frozen renderer" may just be an unfocused
  window. Verify with long-task entries or animation-instance identity,
  not wall-clock.
- Loaders that deny permission via redirect (not 403) look like 200 to a
  followed fetch; probe access control with `redirect: 'manual'`.
- Import autofixers can merge a value import into an `import type` block
  — a build break and a runtime hole. Re-run the app after autofix
  touches imports.
