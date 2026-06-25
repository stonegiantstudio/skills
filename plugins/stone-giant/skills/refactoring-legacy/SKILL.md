---
description: >
  Safe refactoring of legacy code using test-first techniques, dependency breaking,
  and proven patterns. Covers characterization tests, Golden Master, seams, Fowler's
  catalog, and anti-pattern remediation. Use when refactoring, fixing legacy bugs,
  modernizing code, or dealing with "big ball of mud", "spaghetti code", or "god class".
metadata:
  category: engineering
  color: orange
  displayName: "Legacy Code Refactoring"
---

# Legacy Code Refactoring: Safe Transformation of Existing Systems

> "Legacy code is simply code without tests."
> — Michael Feathers, *Working Effectively with Legacy Code*

## The Legacy Code Dilemma

You face a paradox when working with legacy code:

> **You can't refactor code without test coverage, but you need to refactor
> some code to add tests.**

This skill provides techniques to break this cycle safely.

## The Legacy Code Change Algorithm

Before making ANY change to legacy code, follow this algorithm:

```text
┌─────────────────────────────────────────────────────────────┐
│  1. IDENTIFY CHANGE POINTS                                  │
│     Where do you need to make changes?                      │
│     → Use systems-thinking skill to find ALL places         │
├─────────────────────────────────────────────────────────────┤
│  2. FIND TEST POINTS                                        │
│     Where can you write tests to cover the change?          │
│     → Look for seams (places to inject test doubles)        │
├─────────────────────────────────────────────────────────────┤
│  3. BREAK DEPENDENCIES                                      │
│     What's preventing you from testing?                     │
│     → Apply dependency-breaking techniques                  │
├─────────────────────────────────────────────────────────────┤
│  4. WRITE TESTS                                             │
│     Characterize existing behavior BEFORE changing          │
│     → Golden Master for complex output                      │
│     → Unit tests for specific behaviors                     │
├─────────────────────────────────────────────────────────────┤
│  5. MAKE CHANGES AND REFACTOR                               │
│     Now you can safely modify the code                      │
│     → Small steps, run tests after each change              │
└─────────────────────────────────────────────────────────────┘
```

## Core Principle: Characterize Before You Change

**Never modify code until you can prove it still works.**

### The Golden Master Technique

For complex code where behavior is hard to specify:

1. Generate diverse inputs (use same random seed for reproducibility)
2. Run the code, capture ALL outputs
3. Save outputs as the "golden master"
4. After changes, compare new output to golden master
5. Any difference = potential regression

```typescript
// Example: Golden Master for a report generator
describe('ReportGenerator Golden Master', () => {
  it('produces identical output to baseline', () => {
    const inputs = generateDeterministicInputs(seed: 42);
    const output = reportGenerator.generate(inputs);
    expect(output).toMatchSnapshot(); // Golden master comparison
  });
});
```

### When to Use Each Testing Approach

|Situation|Technique|Why|
|---|---|---|
|Complex output, unclear spec|Golden Master|Captures behavior without understanding it|
|Specific behavior to preserve|Characterization Test|Documents what code actually does|
|Adding new behavior|TDD|Write test first, then implement|
|Refactoring internals|Existing tests + Golden Master|Verify no behavior change|

## Finding Seams

A **seam** is a place where you can alter behavior without editing the code directly.

### Types of Seams

#### Object Seams (Preferred)

Inject dependencies instead of creating them internally:

```typescript
// BEFORE: No seam - hard to test
class OrderProcessor {
  process(order: Order) {
    const emailService = new EmailService(); // Created internally
    emailService.send(order.customerEmail, 'Order confirmed');
  }
}

// AFTER: Object seam - testable
class OrderProcessor {
  constructor(private emailService: EmailService) {} // Injected

  process(order: Order) {
    this.emailService.send(order.customerEmail, 'Order confirmed');
  }
}

// In tests: inject a fake
const fakeEmail = { send: vi.fn() };
const processor = new OrderProcessor(fakeEmail);
```

#### Subclass and Override

When you can't change the constructor:

```typescript
// Production code
class ReportGenerator {
  protected getDatabase(): Database {
    return new ProductionDatabase();
  }
}

// Test code
class TestableReportGenerator extends ReportGenerator {
  protected getDatabase(): Database {
    return new FakeDatabase(); // Override for testing
  }
}
```

### Finding Seams Checklist

- [ ] Constructor parameters (inject dependencies)
- [ ] Method parameters (pass collaborators)
- [ ] Protected methods (subclass and override)
- [ ] Configuration/environment variables
- [ ] Factory methods (override creation)

## Dependency Breaking Techniques

When code is tangled and untestable, use these techniques:

### Extract and Override Call

```typescript
// BEFORE: Direct dependency on global
class PriceCalculator {
  calculate(item: Item): number {
    const taxRate = GlobalConfig.getTaxRate(); // Hard to test
    return item.price * (1 + taxRate);
  }
}

// AFTER: Extracted to overridable method
class PriceCalculator {
  calculate(item: Item): number {
    const taxRate = this.getTaxRate();
    return item.price * (1 + taxRate);
  }

  protected getTaxRate(): number {
    return GlobalConfig.getTaxRate();
  }
}

// Test: Override the extracted method
class TestablePriceCalculator extends PriceCalculator {
  protected getTaxRate(): number {
    return 0.1; // Controlled for testing
  }
}
```

### Parameterize Constructor

```typescript
// BEFORE: Creates its own dependencies
class UserService {
  private db = new Database();
  private cache = new RedisCache();
}

// AFTER: Accepts dependencies, with defaults for production
class UserService {
  constructor(
    private db: Database = new Database(),
    private cache: Cache = new RedisCache()
  ) {}
}

// Test: Pass fakes
const service = new UserService(fakeDb, fakeCache);
```

### Introduce Instance Delegator

For static method dependencies:

```typescript
// BEFORE: Static call - untestable
class OrderValidator {
  validate(order: Order): boolean {
    return DateUtils.isBusinessDay(order.date); // Static
  }
}

// AFTER: Instance method wraps static
class OrderValidator {
  validate(order: Order): boolean {
    return this.isBusinessDay(order.date);
  }

  protected isBusinessDay(date: Date): boolean {
    return DateUtils.isBusinessDay(date); // Can be overridden
  }
}
```

## The Refactoring Safety Net

### Before ANY Refactoring

1. **Run existing tests** - Establish green baseline
2. **Add characterization tests** - Cover the code you'll change
3. **Commit** - Create a restore point

### During Refactoring

1. **Small steps** - One refactoring at a time
2. **Run tests after each step** - Catch regressions immediately
3. **Commit frequently** - Every green state is a checkpoint

### The Refactoring Cycle

```text
┌──────────────┐
│ Tests Green  │◄─────────────────────────────┐
└──────┬───────┘                              │
       │                                      │
       ▼                                      │
┌──────────────┐    ┌──────────────┐    ┌─────┴────────┐
│ Small Change │───►│  Run Tests   │───►│ Tests Green? │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │ No
                                              ▼
                                        ┌──────────────┐
                                        │    REVERT    │
                                        └──────────────┘
```

## Scratch Refactoring

When you don't understand the code:

1. **Start refactoring freely** - Rename, extract, reorganize
2. **Don't worry about breaking things** - This is exploratory
3. **Take notes** - Document what you learn
4. **REVERT EVERYTHING** - This was just for understanding
5. **Now refactor properly** - With tests and small steps

> The goal is to get familiar with the code, not to actually clean it.
> The only rule is: **revert your changes when you're done.**

## Integration with Systems-Thinking

This skill works in sequence with `systems-thinking`:

```text
┌─────────────────────────────────────────────────────────────┐
│ SYSTEMS-THINKING PHASE                                      │
│                                                             │
│ 1. Search for patterns across all languages                 │
│ 2. Create impact map of affected files                      │
│ 3. Verify semantic equivalence of implementations           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ REFACTORING PHASE (this skill)                              │
│                                                             │
│ For EACH file in impact map:                                │
│ 1. Write characterization tests                             │
│ 2. Break dependencies if needed                             │
│ 3. Apply appropriate refactoring pattern                    │
│ 4. Verify tests pass                                        │
│ 5. Commit                                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ VERIFICATION PHASE                                          │
│                                                             │
│ 1. Run full test suite                                      │
│ 2. Verify all impact map items addressed                    │
│ 3. Update documentation                                     │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference: Decision Tree

```text
Is the code testable?
├─► YES: Write characterization tests, then refactor
│
└─► NO: Can you add a seam?
    ├─► YES: Add seam, write tests, then refactor
    │
    └─► NO: Apply dependency-breaking technique
        └─► Extract and Override Call
        └─► Parameterize Constructor
        └─► Introduce Instance Delegator
        └─► Subclass and Override
```

## Pre-Refactoring Checklist

- [ ] **Used systems-thinking** to find all affected code
- [ ] **Characterized existing behavior** with tests or Golden Master
- [ ] **Identified seams** for dependency injection
- [ ] **Created restore point** (committed current state)
- [ ] **Planned small steps** (each independently verifiable)
- [ ] **Documented intent** (why this refactoring?)

## Post-Refactoring Checklist

- [ ] **All tests pass** (existing + new characterization tests)
- [ ] **No behavior changes** (unless intentional)
- [ ] **Code is cleaner** (measurably: fewer dependencies, shorter methods)
- [ ] **Updated all instances** (from systems-thinking impact map)
- [ ] **Committed with clear message** explaining the refactoring

## Related Files

- `test-strategies.md` - Deep dive on Golden Master and characterization tests
- `catalog.md` - Fowler's refactoring patterns with when-to-use guidance
- `anti-patterns.md` - Recognizing and remediating Big Ball of Mud, God Class, etc.
- `references.md` - Citations and further reading

## The Mantra

> Characterize first. Small steps. Tests after every change. Revert if red.
