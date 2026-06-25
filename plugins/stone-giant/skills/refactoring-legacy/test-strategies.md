# Test Strategies for Legacy Code

> "The first step in refactoring legacy code is to get it under test.
> The challenge is doing so without changing the code."

## The Testing Paradox

Legacy code is hard to test because:

1. **Tight coupling** - Classes create their own dependencies
2. **Hidden dependencies** - Global state, singletons, static calls
3. **No interfaces** - Concrete classes everywhere
4. **Side effects** - Methods do more than their name suggests

## Golden Master Testing

### What It Is

Golden Master (also called Approval Testing or Snapshot Testing) captures the
current behavior of code without understanding it:

1. Run the code with various inputs
2. Capture ALL outputs (return values, files, database changes, logs)
3. Save as the "golden master" (the authoritative baseline)
4. After changes, compare new output to the golden master
5. Any difference requires investigation

### When to Use Golden Master

|Use Golden Master When|Don't Use When|
|---|---|
|Behavior is correct but undocumented|Behavior is known to be buggy|
|Output is complex (reports, files)|Output is simple (true/false)|
|You need to refactor safely|You're adding new features|
|Understanding the code would take too long|You need to change behavior|

### Implementation Pattern

```typescript
import { describe, it, expect } from 'vitest';

describe('LegacyReportGenerator - Golden Master', () => {
  // Use deterministic seed for reproducible inputs
  const SEED = 42;

  it('produces consistent output for standard inputs', () => {
    const generator = new LegacyReportGenerator();
    const inputs = generateTestInputs(SEED);

    const output = generator.generate(inputs);

    // First run: creates snapshot
    // Subsequent runs: compares to snapshot
    expect(output).toMatchSnapshot();
  });

  it('handles edge cases consistently', () => {
    const generator = new LegacyReportGenerator();
    const edgeCases = [
      { input: null, name: 'null input' },
      { input: [], name: 'empty array' },
      { input: generateLargeInput(), name: 'large dataset' },
    ];

    for (const { input, name } of edgeCases) {
      const output = generator.generate(input);
      expect(output).toMatchSnapshot(name);
    }
  });
});
```

### Handling Non-Determinism

Legacy code often has non-deterministic elements:

|Source|Solution|
|---|---|
|Timestamps|Inject a clock, or filter from output|
|Random numbers|Seed the generator, or mock it|
|Thread IDs|Filter from output comparison|
|File paths|Normalize or filter|
|Database IDs|Use predictable test data|

```typescript
// Example: Filtering non-deterministic parts
function normalizeOutput(output: string): string {
  return output
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
    .replace(/id: \d+/g, 'id: ID')
    .replace(/thread-\d+/g, 'thread-N');
}

it('produces consistent output after normalization', () => {
  const output = normalizeOutput(legacyCode.run());
  expect(output).toMatchSnapshot();
});
```

### Golden Master Workflow

```
┌────────────────────────────────────────────────────────┐
│ 1. CREATE GOLDEN MASTER                                │
│                                                        │
│    Run code → Capture output → Save snapshot           │
│    Commit snapshot file with tests                     │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ 2. REFACTOR WITH CONFIDENCE                            │
│                                                        │
│    Make small change → Run tests → Compare to master   │
│    If different: investigate or revert                 │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ 3. UPDATE MASTER (if behavior change is intentional)   │
│                                                        │
│    Review diff carefully                               │
│    Update snapshot: vitest -u                          │
│    Commit with explanation of why behavior changed     │
└────────────────────────────────────────────────────────┘
```

## Characterization Tests

### What They Are

Characterization tests document what the code **actually does**, not what it
**should do**. They're written by observing behavior, not from requirements.

### The Process

```typescript
// Step 1: Write a test that you expect to fail
it('returns something for valid input', () => {
  const result = legacyFunction('test input');
  expect(result).toBe('???'); // What does it actually return?
});

// Step 2: Run the test, observe the actual value
// Output: Expected '???' but received 'PROCESSED: test input'

// Step 3: Update the test with the actual behavior
it('prefixes processed inputs with PROCESSED:', () => {
  const result = legacyFunction('test input');
  expect(result).toBe('PROCESSED: test input');
});

// Step 4: Repeat for edge cases
it('returns empty string for null input', () => {
  const result = legacyFunction(null);
  expect(result).toBe(''); // Discovered through observation
});
```

### Characterization Test Checklist

- [ ] **Happy path** - Normal expected inputs
- [ ] **Edge cases** - Empty, null, boundary values
- [ ] **Error cases** - Invalid inputs, what exceptions are thrown?
- [ ] **Side effects** - What else changes? (files, database, state)
- [ ] **Return values** - All possible return types

### Example: Characterizing a Legacy Function

```typescript
describe('LegacyOrderProcessor characterization', () => {
  // Document what we learn about the function
  describe('process() behavior', () => {
    it('returns order ID for valid orders', () => {
      const order = createValidOrder();
      const result = processor.process(order);
      expect(result).toMatch(/^ORD-\d{6}$/); // Learned: returns ORD-NNNNNN
    });

    it('throws for orders with no items', () => {
      const order = createOrderWithNoItems();
      expect(() => processor.process(order))
        .toThrow('Order must have at least one item'); // Learned: validates items
    });

    it('sends email as side effect', () => {
      const order = createValidOrder();
      processor.process(order);
      expect(emailService.send).toHaveBeenCalledWith(
        order.customerEmail,
        expect.stringContaining('Order confirmed')
      ); // Learned: sends confirmation email
    });

    it('writes to audit log', () => {
      const order = createValidOrder();
      processor.process(order);
      expect(auditLog.entries).toContainEqual(
        expect.objectContaining({ action: 'ORDER_PROCESSED' })
      ); // Learned: logs to audit
    });
  });
});
```

## Seams: Where to Insert Tests

### Identifying Seams

A seam is where you can change behavior without editing production code.

**Constructor Seams**

```typescript
// Seam: Constructor parameter
class OrderService {
  constructor(
    private repo: OrderRepository,  // ← Seam: inject fake
    private email: EmailService     // ← Seam: inject fake
  ) {}
}
```

**Method Parameter Seams**

```typescript
// Seam: Method parameter
class ReportGenerator {
  generate(data: Data, formatter: Formatter) { // ← Seam: pass fake formatter
    return formatter.format(data);
  }
}
```

**Protected Method Seams**

```typescript
// Seam: Protected method (subclass and override)
class DataProcessor {
  process(input: string): string {
    const data = this.fetchData(input); // ← Seam: override in test
    return this.transform(data);
  }

  protected fetchData(input: string): Data {
    return this.database.query(input);
  }
}

// Test subclass
class TestableDataProcessor extends DataProcessor {
  protected fetchData(input: string): Data {
    return { /* fake data */ };
  }
}
```

### Creating Seams (Minimally Invasive)

When no seam exists, create one with minimal changes:

**Before: No seam**

```typescript
class PriceCalculator {
  calculate(item: Item): number {
    const tax = TaxService.getCurrentRate(); // Static call - no seam
    return item.price * (1 + tax);
  }
}
```

**After: Seam added**

```typescript
class PriceCalculator {
  calculate(item: Item): number {
    const tax = this.getTaxRate(); // Now overridable
    return item.price * (1 + tax);
  }

  protected getTaxRate(): number {
    return TaxService.getCurrentRate();
  }
}
```

This is a **safe change** because:

- No behavior change (same code path in production)
- Creates a seam for testing
- Minimal modification to existing code

## Sensing and Separation

### Sensing

**Sensing** is gaining access to values that code computes:

```typescript
// Problem: Can't sense what email was sent
class OrderProcessor {
  process(order: Order): void {
    // ... processing ...
    EmailService.send(order.email, 'Confirmed'); // Fire and forget
  }
}

// Solution: Inject and sense
class OrderProcessor {
  constructor(private emailService: EmailService) {}

  process(order: Order): void {
    // ... processing ...
    this.emailService.send(order.email, 'Confirmed');
  }
}

// Test can now sense
const fakeEmail = { send: vi.fn() };
const processor = new OrderProcessor(fakeEmail);
processor.process(order);
expect(fakeEmail.send).toHaveBeenCalledWith('customer@example.com', 'Confirmed');
```

### Separation

**Separation** is isolating code so it can be tested independently:

```typescript
// Problem: Database and business logic intertwined
class OrderValidator {
  validate(order: Order): boolean {
    const customer = db.query(`SELECT * FROM customers WHERE id = ${order.customerId}`);
    if (!customer.active) return false;
    if (order.total > customer.creditLimit) return false;
    return true;
  }
}

// Solution: Separate concerns
class OrderValidator {
  constructor(private customerRepo: CustomerRepository) {}

  validate(order: Order): boolean {
    const customer = this.customerRepo.findById(order.customerId);
    return this.validateBusinessRules(order, customer);
  }

  // Now testable in isolation
  validateBusinessRules(order: Order, customer: Customer): boolean {
    if (!customer.active) return false;
    if (order.total > customer.creditLimit) return false;
    return true;
  }
}
```

## Test Doubles

### Types of Test Doubles

|Type|Purpose|When to Use|
|---|---|---|
|**Dummy**|Fill parameter lists|When parameter is required but not used|
|**Stub**|Provide canned answers|When you need controlled return values|
|**Spy**|Record calls for later verification|When you need to verify interactions|
|**Mock**|Pre-programmed with expectations|When order/count of calls matters|
|**Fake**|Working implementation (simplified)|When you need realistic behavior|

### Examples

```typescript
// Dummy - just fills the parameter
const dummyLogger: Logger = { log: () => {} };

// Stub - returns controlled values
const stubRepo: Repository = {
  findById: () => ({ id: 1, name: 'Test' }),
};

// Spy - records calls
const spyEmail = {
  calls: [] as Array<{ to: string; body: string }>,
  send(to: string, body: string) {
    this.calls.push({ to, body });
  },
};

// Fake - simplified working implementation
const fakeDatabase = {
  data: new Map<string, any>(),
  save(id: string, entity: any) { this.data.set(id, entity); },
  findById(id: string) { return this.data.get(id); },
};
```

## Coverage Strategy

### What to Cover First

1. **Code you're about to change** - Highest priority
2. **Complex branching logic** - High bug potential
3. **Code that's failed before** - Historical risk
4. **Shared utilities** - High impact if they break

### What NOT to Spend Time On

- Getters/setters with no logic
- Framework/library code
- Code scheduled for deletion
- Pure delegation methods

## Quick Reference

### Golden Master Checklist

- [ ] Deterministic inputs (seeded random, fixed data)
- [ ] All outputs captured (return values, files, side effects)
- [ ] Non-determinism filtered (timestamps, IDs)
- [ ] Snapshot committed with tests
- [ ] Process documented for team

### Characterization Test Checklist

- [ ] Happy path documented
- [ ] Edge cases discovered and tested
- [ ] Error behavior documented
- [ ] Side effects identified
- [ ] Return value patterns understood

### Seam Creation Checklist

- [ ] Minimal change to production code
- [ ] No behavior change
- [ ] Test can now inject dependencies
- [ ] Original code path still works
