# CI performance: primary sources

The methodology in `SKILL.md` is distilled from these. Verify a claim here
before quoting it as first-party.

## Sharding / parallelization

- Playwright sharding (the "wall-clock = slowest shard, not sum" statement): <https://playwright.dev/docs/test-sharding>
- Bazel test sharding + hermeticity (`TEST_TOTAL_SHARDS`/`TEST_SHARD_INDEX`, `TEST_TMPDIR`): <https://bazel.build/reference/test-encyclopedia>
- pytest-xdist per-worker isolation (`worker_id`, `loadgroup`): <https://pytest-xdist.readthedocs.io/en/stable/distribution.html>
- Vitest sharding + merge-reports: <https://vitest.dev/guide/improving-performance>
- CircleCI timing-based splitting: <https://circleci.com/docs/guides/optimize/parallelism-faster-jobs/>
- Buildkite bin-packing on historical timing: <https://buildkite.com/resources/blog/beyond-basic-test-splitting-buildkite-s-approach-to-test-suite-parallelization/>
- Shopify (170k+ tests, 41h single-machine -> p95 45 to 18 min across hundreds of workers): <https://shopify.engineering/faster-shopify-ci>

## Critical path / DAG / Amdahl

- Buck2 "why" (single incremental graph, computes the critical path, 2x faster than Buck1): <https://buck2.build/docs/about/why/> and <https://engineering.fb.com/2023/04/06/open-source/buck2-open-source-large-scale-build-system/>
- GitHub Actions job DAG / fan-out-fan-in via `needs`: <https://oneuptime.com/blog/post/2025-12-20-job-dependencies-github-actions/view>
- GitHub's own scale (~15k jobs/hour across 150k cores = parallelism, not big boxes): <https://github.blog/engineering/infrastructure/how-github-uses-github-actions-and-actions-larger-runners-to-build-and-test-github-com/>

## Caching

- Bazel remote caching (Action Cache + content-addressable storage) + hermeticity precondition: <https://bazel.build/remote/caching> and <https://bazel.build/basics/distributed-builds>
- Gradle build cache: <https://docs.gradle.org/current/userguide/build_cache.html>
- Turborepo remote cache: <https://turborepo.dev/docs/core-concepts/remote-caching>
- Nx remote cache / affected: <https://nx.dev/docs/features/ci-features/remote-cache>
- GitHub Actions dependency caching (store, not `node_modules`; lockfile-hash key): <https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching>
- Docker layer-cache optimization (manifests-first ordering, `--cache-from/--cache-to`, `RUN --mount=type=cache`): <https://docs.docker.com/build/cache/optimize/>

## Test selection

- Google "Taming Google-Scale Continuous Testing" (TAP, affected-targets via reverse dep graph), ICSE-SEIP 2017: <https://research.google/pubs/taming-google-scale-continuous-testing/>
- Meta Predictive Test Selection (ML; ~1/3 of dependent tests, >99.9% regressions caught, ~2x cost cut): <https://engineering.fb.com/2018/11/21/developer-tools/predictive-test-selection/> and <https://arxiv.org/abs/1810.05286>
- Uber SubmitQueue ("Keeping Master Green at Scale", -53% CI use / -37% wait): <https://www.uber.com/blog/research/keeping-master-green-at-scale/>
- Dropbox Affected Module Detector (75 to 25 min): <https://dropbox.tech/mobile/revamping-the-android-testing-pipeline-at-dropbox>

## Runners / concurrency / merge queues / flaky tests

- GitHub Actions runner pricing (check current rates -- the 2026 change moved both hosted rates and the self-hosted fee; the relative Linux/Windows/macOS multipliers are the stable part): <https://docs.github.com/en/billing/reference/actions-runner-pricing>
- "More cores don't speed up pinned-serial tests": <https://threedots.tech/post/go-test-parallelism/>
- GitHub Actions concurrency / `cancel-in-progress` (kill superseded runs, free the pool): <https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs>
- GitHub Merge Queue (speculative batching + bisection): <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue>
- Google flaky tests (1.5% of runs, ~16% of tests; auto-quarantine): <https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html>
- Slack flaky auto-suppress (main stability 20% -> 96%): <https://slack.engineering/handling-flaky-tests-at-scale-auto-detection-suppression/>
- Atlassian Flakinator (flaky-test *detection* dashboard, not just quarantine): <https://www.atlassian.com/blog/atlassian-engineering/taming-test-flakiness-how-we-built-a-scalable-tool-to-detect-and-manage-flaky-tests>

Secondary (verify before quoting as first-party): Spotify test-impact figures
via qubika.com; assorted before/after via yrkan.com and bitrise.io.
