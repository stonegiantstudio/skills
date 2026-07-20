# Worked example — one full de-slop pass

Before (168 words, written for this file as a typical AI draft), after
(the edited result), and the annotations. This draft is dense with
tells, so the pass rewrote nearly every sentence; on a typical mixed
draft the same workflow lands in the 25–40% benchmark, and anything
below 25% on an AI draft is under-editing.

## Before

> In today's fast-paced development landscape, choosing the right
> caching strategy is crucial. It's not just about performance — it's
> about delivering a seamless user experience. Let's delve into how we
> approached this challenge.
>
> Our team embarked on a comprehensive evaluation of the available
> options. We meticulously compared Redis, Memcached, and in-process
> caching, carefully weighing the intricate trade-offs of each
> approach. Ultimately, we selected Redis for its robust feature set
> and vibrant ecosystem.
>
> The results were transformative. Response times improved
> significantly, highlighting the importance of a well-designed caching
> layer. Additionally, our infrastructure costs decreased, underscoring
> the value of this pivotal architectural decision.
>
> It's worth noting that caching isn't a silver bullet. There are
> nuanced considerations around invalidation — arguably the hardest
> problem in computer science. Whether you're a startup or an
> enterprise, it's important to carefully evaluate your specific needs.
>
> In conclusion, our journey to a better caching strategy was a
> testament to the power of methodical engineering. The landscape will
> continue to evolve, but the fundamentals remain paramount.

## After

> We rebuilt our caching layer last quarter. The p95 on the dashboard
> API was 900ms; it needed to be under 200ms.
>
> We tried three options. In-process caching was fastest but died on
> every deploy — twelve times a day. Memcached fixed that but lacks the
> sorted sets our leaderboard queries need. Redis has them, so Redis
> won, mostly by elimination.
>
> The p95 dropped to 140ms and the RDS bill fell 30% because the read
> replicas went from three to one.
>
> Invalidation is still the hard part. We got it wrong twice: stale
> session data the first week, then a cache stampede when a popular key
> expired during a traffic spike. Key-versioning fixed the first;
> jittered TTLs fixed the second.
>
> The strategy is unglamorous: cache reads behind a version key, jitter
> every TTL, and measure before touching anything else.

## Annotations

| Edit | Tell removed (signal) | Directive applied |
|---|---|---|
| Opening rewritten around 900ms → 200ms | "In today's fast-paced…" stock opener (S1); thesis-preview (S2) | Take a position and say it first; start inside the idea |
| "crucial… seamless… delve" cut | Tier-1 lexicon (S1) | Prefer definite, specific, concrete language |
| "It's not just about X — it's about Y" cut | Negative parallelism (S2) | Put statements in positive form |
| Vendor comparison rewritten with failure modes | "meticulously… intricate" (S1); no specifics (S5) | Ground every abstraction; volunteer one failure |
| "The results were transformative" → measured numbers | Significance inflation (S6); "highlighting the importance" trailing clause (S5) | End on the emphatic word |
| "It's worth noting… arguably… Whether you're a…" cut | Stock phrases, both-sides hedging (S1, S4) | Commit; write for one person |
| "In conclusion… testament… landscape… paramount" cut | Recap ending (S2); Tier-1 lexicon (S1) | End on the last new fact |
| Sentence lengths varied; two short landings added | Uniform rhythm (S3) | Rhythm pass |
