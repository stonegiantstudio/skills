---
description: Make a CI/CD pipeline faster. Use when asked to speed up CI, cut build/test wall-clock, fix a slow pipeline, or decide whether bigger runners vs sharding vs caching will help. A measure-the-critical-path mental model plus a stop-when-it-stops-paying ladder (cache deps -> parallel jobs -> shard tests -> isolate per-shard resources -> right-size runners -> build cache -> test selection -> merge queue).
---

# CI performance

The whole game: CI wall-clock is the **critical path** (the slowest dependent
chain), not the sum of the steps. So you either **do less** (cache what is
unchanged; later, run only the tests a change can affect) or **do it
concurrently** (parallel jobs; shard the suite). Hardware only helps if the work
actually parallelizes.

## Always measure first

Do not optimize from a guess. Pull the **per-step durations** of the slowest
job and find the real long pole. Teams routinely "fix" the wrong thing.

- GitHub Actions: `gh api --paginate 'repos/{owner}/{repo}/actions/runs/{id}/jobs?per_page=100' --jq '.jobs[] | {name, steps: [.steps[] | {name, s: .started_at, e: .completed_at}]}'`, or compute each job's `started_at -> completed_at`. **Paginate** -- the jobs API returns 30 per page by default, so a matrix-heavy run silently drops jobs past the first page and you measure the wrong long pole.
- Distinguish **execution time** from **queue/dependency wait**. A job that "takes 2m" may be 40s of work behind 1m20s of waiting on its `needs:`. You can't optimize the wait if the dependency is correct (e.g. don't deploy before tests pass).
- Separate **code-gate feedback** (is my change sound? -> typecheck/lint/test) from **deploy-prep** (migrate/seed a staging env). Speeding the gates helps iteration; speeding deploy-prep only helps "all green" time.

## The mental model

- **Critical path, not sum.** Independent branches in parallel collapse to `max(branch)`. Splitting a serial job into parallel jobs is the CI form of this.
- **Amdahl's law caps it.** If fraction `f` of work is serial, max speedup from P workers is `1/(f + (1-f)/P)`, ceiling `1/f`. Adding parallelism never beats the slowest single branch -- shorten *that*.
- This is how Bazel/Buck2 think: model the build as a DAG, run independent actions concurrently, cache identical ones. Buck2 "calculates the critical path and gets out of the way."

## The ladder (work top-down, stop where it stops paying)

Rungs 1-2 are universal near-free wins worth taking regardless; from rung 3 on,
aim each move at the *measured* critical path and stop where the next rung stops
paying.

1. **Cache dependencies**, keyed on the lockfile hash. Cache the package-manager *store* (not `node_modules`), with `restore-keys` for partial hits. Cheapest universal win; also the mitigation for fan-out's repeated installs. **Warm the cache on the default branch:** a PR-branch hit depends on `main` having already populated the key, so the high hit rates everyone quotes assume a cache the trunk push fills first.
2. **Cancel superseded runs, and fail fast.** A `concurrency:` group keyed on the ref with `cancel-in-progress: true` kills the runs a rapid re-push made obsolete, and matrix `fail-fast` stops the other legs once one goes red. Near-zero effort. This frees the pool rather than shortening your single run's critical path -- but on a contended branch the freed pool *is* your queue time.
3. **Remove false ordering.** Jobs with no real dependency should run in parallel (GitHub Actions runs them in parallel unless `needs:` forces order). A monolithic `lint -> typecheck -> test` job split into parallel jobs drops to `max()`.
4. **Split out the long pole.** Targeting matters: isolate the *slowest* serial step (often `tsc`) so it runs beside the fast ones, not in front. Splitting already-fast steps apart buys little. When several jobs need the same build, **build once and fan out** via `upload-artifact`/`download-artifact` rather than rebuilding per job (distinct from dep caching -- it moves a produced artifact, not restores a store).
5. **Shard the test suite** once it is the long pole (rule of thumb: > ~5 min). `vitest --shard=i/N` / `jest --shard` / `playwright --shard` / `pytest-xdist` / Bazel `shard_count`. Prefer **timing-based** splitting (CircleCI `--split-by=timings`, Buildkite bin-packing) over file-count -- N shards only approach Nx if balanced. Merge reports in a follow-up job.
6. **Isolate per-shard stateful resources.** When tests share a DB/filesystem and cannot run concurrently, give each parallel unit its own resource keyed by the runner index (`TEST_SHARD_INDEX`, `PYTEST_XDIST_WORKER`/`worker_id`, `CI_NODE_INDEX`) and keep tests serial *within* the unit. This is the industry-standard pattern (Bazel hermeticity + `TEST_TMPDIR`; xdist per-worker DB; shared-state collisions between parallel units are a leading cause of flaky failures).
7. **Right-size the runner -- but only if the work parallelizes.** A serially-pinned suite (e.g. vitest `fileParallelism: false` for shared-DB tests) gets *zero* benefit from more cores; parallel jobs are the only lever. Bigger machines buy latency, not savings (per-minute scales with size). Default to Linux: Windows roughly ~1.7x the per-minute cost (and often slower I/O for JS/Node CI), macOS ~10x. Check current rates before quoting absolutes -- hosted pricing and the self-hosted economics shift (third-party runners like Blacksmith/WarpBuild advertise ~2x single-core speed; GitHub's 2026 pricing changed both hosted rates and the self-hosted fee).
8. **Cache build output** (content-addressable). Bazel CAS, Gradle build cache, Turborepo, Nx -- hash all declared inputs, key a store, replay on hit, share across machines. 50-90% reductions at high hit rates. **Correctness hazard: a stale cache returning a wrong result.** Defense: content-address on *every* input that affects the output. Over-key (extra miss, safe) rather than under-key (wrong result, dangerous). The only real failure mode is an *undeclared* input.
9. **Cache Docker layers** -- whenever a Dockerfile is on the path, often the dominant build-time lever. Order the Dockerfile manifests-first (copy the lockfile and install *before* `COPY . .`) so a source edit does not bust the dependency layer, and back it with a remote layer cache (`docker buildx --cache-to/--cache-from type=gha,mode=max`, or `RUN --mount=type=cache` for the package store). Routinely 70%+ off. Same undeclared-input hazard as rung 8.
10. **Skip re-running work whose inputs did not change** (the same idea, applied to your own steps). E.g. re-seeding a shared staging DB on every PR is a no-op unless the seed/migration sources changed -- gate it on `git diff <base>...HEAD` touching those paths (always run it on the trunk push so the env stays current).
11. **Test selection** (the scalable lever for large suites). Sharding makes one run faster but still runs every test on every change; cost grows as `changes x tests`. Run only affected tests: graph-based first (Bazel `rdeps`, Nx `affected`, Turborepo `turbo run --filter`, Jest `--changedSince` -- deterministic, free once you have a graph; in a JS monorepo `nx affected` / `turbo --filter` is often the single biggest win), ML predictive only at extreme scale (Meta runs ~1/3 of dependent tests, catches >99.9% of regressions, ~2x cost cut). Graduate here when full-suite cost outgrows your ability to throw runners at it.
12. **Throughput, not latency** (many devs on one branch): merge queues / trains (speculative batching -- Uber SubmitQueue took mainline from 52% green to always-green; GitHub Merge Queue, Shopify) + flaky-test quarantine (Google auto-quarantines; Slack's auto-suppress moved main stability 20% -> 96%). A flaky required check stalls the whole queue, so pair them. Quarantine needs a **detector**: a rolling pass-rate dashboard (flag tests under ~98%) feeds the quarantine list; quarantine without detection rots into manual triage.

## Caching a stateful artifact (DB, etc.) without poisoning it

A plain cache action saves at *post-job*, which is **after** tests mutate the
file -- it would cache a polluted artifact. Use **restore at the start +
explicit save before the test step**, so the cached copy is the clean built
state. Verify the artifact is self-contained at save time (e.g. SQLite with no
open WAL: the build process must have exited/checkpointed). On a cold key,
parallel shards race to save the same key -- first wins, the rest no-op with a
warning (not a failure).

## Diagnostic questions for any pipeline

- What is the **critical path** in wall-clock? Optimize that, nothing else.
- Is the slow job **CPU-bound and parallelizable**, or pinned serial? Only the first benefits from more cores; the second needs more jobs.
- Is each parallel unit **isolated**, or fighting over shared state and going flaky?
- Are the cache keys **complete** -- every input that affects the output? An undeclared input is the one real cache hazard.
- Is this step's work **a no-op when its inputs did not change**? If so, gate it on a diff.
- Are **obsolete runs from superseded pushes** still burning the pool? Add `cancel-in-progress`. Is a poorly-ordered **Dockerfile** on the critical path? Reorder manifests-first and cache layers.

## Reference

`reference.md` (alongside this file) holds the primary sources behind every
claim above: Google "Taming Google-Scale Continuous Testing", Meta Predictive
Test Selection, Uber SubmitQueue, Shopify, Bazel/Buck2, GitHub Actions docs, and
runner pricing.

A measured application of this ladder on a real Vitest + SQLite pipeline:
parallel gate jobs + a 3-way `vitest --shard` (each shard its own freshly
seeded `local.db`) cut code-gate feedback from ~3.4 min to ~1.5 min (~2.4x). A
seeded-DB cache (restore + save-before-tests) and a diff-gated staging re-seed
trimmed the tail further. Bigger runners were explicitly rejected -- the suite
is `fileParallelism: false`, so extra cores sat idle.

This skill is CI-system-agnostic in principle; the concrete examples lean
GitHub Actions + the JS/bun/vitest stack where the ladder was first proven.
