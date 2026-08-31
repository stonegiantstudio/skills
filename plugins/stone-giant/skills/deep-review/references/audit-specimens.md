# Audit specimens

Worked examples for the two cross-cutting audits in `SKILL.md`. The rules
there are general; these are the incidents that produced them. Read this
file when an audit fires and you want to see the shape it is looking for.

## Framework-bypass: the fetcher that wasn't

**Rule (from `SKILL.md`):** code that reimplements a framework primitive by
hand must reproduce what the primitive did implicitly, verified against the
framework's dispatch code — never inferred from a constant's name.

**Specimen.** React Router fetchers rewrite their target to `${path}.data`,
and the server then runs ONLY the action. A hand-rolled `fetch()` POST to
the bare route path is a *document* request instead: the server runs the
action, then every loader in the matched route tree, then a full HTML
render. `shouldRevalidate` cannot stop it — that hook governs revalidation
after a navigation, not the loader sweep a document POST triggers.

The diff that introduced it looked like a small optimization: replacing
`fetcher.submit` with a `navigator.sendBeacon` call to the same path. The
constant was still named after the route, so nothing in review read as
wrong. The cost only appears when you ask what the server executes.

**The question the audit asks:** for every new network call a diff adds,
state which action, which loaders, and which database calls the server
actually runs for that request — and whether that cost is proportionate.

## Recombination: the unfloored numerator

**Rule (from `SKILL.md`):** when a diff adds a shared helper or field that
encodes a subtlety, grep for consumers that recombine its raw inputs. Each
recombination site can silently undo the documented rationale.

**Specimen.** A helper computed a per-unit rate and deliberately floored the
denominator — the floor was the whole point, documented in a comment above
it. A caller elsewhere wanted the same rate, did not call the helper, and
divided the *unfloored* numerator by the *floored* denominator it read from
a neighboring field. Both numbers were correct. Their quotient was not,
and it drifted only on the inputs where the floor mattered, so no test
caught it.

**The fix that generalizes:** ship the derived quantity consumers actually
want, so the subtlety is decided once inside the function that knows about
it. A helper that exposes its raw inputs invites recombination; one that
exposes its result does not.
