# Agent Philosophy References

## Source Lineage

### Foundational Texts

**Out of the Tar Pit** (Moseley & Marks, 2006)
State as the primary source of complexity. Essential vs accidental complexity. Functional and relational approaches to complexity management.

**A Philosophy of Software Design** (Ousterhout, 2018)
Deep vs shallow modules. Strategic vs tactical programming. Complexity as the root cause of software difficulty.

**Hints for Computer System Design** (Lampson, 1983)
Pragmatic heuristics from decades of systems building. "Do one thing well." "Use brute force." "Keep secrets."

**Worse is Better** (Gabriel, 1989)
The New Jersey vs MIT philosophy. Why simpler implementations win in practice. Iteration over perfection.

### On Failure and Trust

**Reflections on Trusting Trust** (Thompson, 1984)
Trust chains cannot be fully verified. The limits of source-level inspection.

**A Note on Distributed Computing** (Waldo et al., 1994)
Remote operations fail differently than local operations. The fallacy of transparent distribution.

### On Human Factors

**The Psychology of Computer Programming** (Weinberg, 1971)
Egoless programming. Human factors in software development. Reading code as a primary activity.

**The Design of Everyday Things** (Norman, 1988)
Affordances, signifiers, feedback. Human-centered design principles.

### On Systems

**Systemantics / The Systems Bible** (Gall, 1975/2002)
Systems evolve; they resist change; they fail in unexpected ways. Gall's Law.

**The Humble Programmer** (Dijkstra, 1972)
Intellectual humility as engineering discipline. The limits of human cognition.

### On Practice

**The Mythical Man-Month** (Brooks, 1975/1995)
Conceptual integrity. The second-system effect. No silver bullet. Communication overhead.

**The Cathedral and the Bazaar** (Raymond, 1997)
Release early, release often. The value of user feedback.

**The Pragmatic Programmer** (Hunt & Thomas, 1999)
Tracer bullets. DRY. Orthogonality. Practical heuristics for working programmers.

**The Unix Philosophy** (McIlroy, Pike, Kernighan, Thompson, et al.)
Modularity. Composition. Simplicity. Text streams. Do one thing well.

**The Zen of Python** (Peters, 2004)
Explicit over implicit. Simple over complex. Readability counts.

### On Cognition and Limits

**Gödel, Escher, Bach** (Hofstadter, 1979)
Self-reference, strange loops, the limits of formal systems.

---

## Quick Reference

### When You're Unsure What to Do

1. Define success criteria (what does "done" look like?)
2. Start with read-only inspection
3. Identify the smallest reversible step
4. Take it, verify the result
5. Repeat or escalate

### When You're Unsure Whether to Proceed

Ask:

- Is this reversible? (If no, stop and confirm)
- Do I have evidence or am I inferring? (If inferring, say so)
- Is this in scope? (If unclear, ask)
- What's the worst case? (If severe, reduce scope)

### When You've Made a Mistake

1. Stop immediately
2. Assess: what changed? what's the impact?
3. Report: what happened, why, what you know
4. Rollback if possible
5. Document for prevention

### Core Mantras

- **"Correct, then fast, then elegant"** — priority order
- **"If it's not tested, it's broken"** — verification mindset
- **"State is guilt until proven innocent"** — complexity management
- **"Ship the smallest thing that teaches you something"** — iteration discipline
- **"The map is not the territory"** — epistemic humility
