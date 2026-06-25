# Anti-Pattern Recognition and Remediation

> "The first step in solving a problem is recognizing you have one."

This guide covers common anti-patterns, how to recognize them, and strategies
for safely remediating them.

## The Big Ball of Mud

### Recognition

A Big Ball of Mud is a system that lacks perceivable architecture.

**Symptoms:**

- No clear module boundaries
- Everything depends on everything
- Changes ripple unpredictably
- New developers take months to be productive
- "Just put it here for now" is common
- No one understands the whole system

**Code Smells:**

```typescript
// Circular dependencies
import { UserService } from './OrderService'; // OrderService imports UserService
import { OrderService } from './UserService'; // UserService imports OrderService

// God imports - one file imports half the codebase
import { User, Order, Product, Cart, Payment, Shipping, ... } from './types';

// No separation of concerns
class OrderProcessor {
  process(order: Order) {
    // Validation logic
    // Database queries
    // Business rules
    // Email sending
    // Logging
    // Metrics
    // All in one 500-line method
  }
}
```

### Remediation Strategy

**The Strangler Fig Pattern**

Don't try to rewrite. Incrementally replace:

```
┌────────────────────────────────────────────────────────────┐
│ PHASE 1: IDENTIFY                                          │
│                                                            │
│ Find a bounded context (e.g., "user authentication")       │
│ Map its boundaries and dependencies                        │
│ This becomes your first extraction target                  │
└────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│ PHASE 2: FACADE                                            │
│                                                            │
│ Create a facade/proxy that intercepts calls                │
│ Initially, facade just delegates to legacy code            │
│ All callers go through the facade                          │
└────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│ PHASE 3: TRANSFORM                                         │
│                                                            │
│ Build new implementation behind the facade                 │
│ Migrate traffic gradually (feature flags)                  │
│ Compare outputs between old and new                        │
└────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│ PHASE 4: ELIMINATE                                         │
│                                                            │
│ When 100% traffic on new implementation                    │
│ Remove legacy code                                         │
│ Remove facade (or keep as API boundary)                    │
└────────────────────────────────────────────────────────────┘
```

**Consolidation Strategy**

Alternate between expansion and consolidation:

- **Expansion**: Add features, accept some mess
- **Consolidation**: Stop features, clean up
- Schedule regular consolidation sprints
- "Refactoring budget" in every sprint

### Prevention

- Enforce module boundaries (linting rules)
- Regular architecture reviews
- "Scout rule" - leave code cleaner than you found it
- Resist "just for now" shortcuts

## God Class

### Recognition

A God Class does too much and knows too much.

**Symptoms:**

- Class has hundreds or thousands of lines
- Class name is vague: "Manager", "Helper", "Utils", "Service"
- Class has many unrelated methods
- Class has many instance variables
- Other classes are just data containers
- Testing requires mocking everything

**Metrics:**

|Metric|Healthy|Warning|God Class|
|---|---|---|---|
|Lines of code|< 200|200-500|> 500|
|Methods|< 15|15-30|> 30|
|Dependencies|< 5|5-10|> 10|
|Responsibilities|1|2-3|> 3|

**Example God Class:**

```typescript
class ApplicationManager {
  // User management
  createUser() { }
  deleteUser() { }
  updateUserProfile() { }

  // Order processing
  createOrder() { }
  processPayment() { }
  shipOrder() { }

  // Reporting
  generateSalesReport() { }
  generateUserReport() { }

  // Email
  sendWelcomeEmail() { }
  sendOrderConfirmation() { }

  // Logging
  logActivity() { }
  logError() { }

  // Configuration
  loadConfig() { }
  saveConfig() { }

  // ... 50 more methods
}
```

### Remediation Strategy

**Step 1: Identify Responsibilities**

Group methods by what they do:

```typescript
// Group 1: User management
createUser, deleteUser, updateUserProfile

// Group 2: Order processing
createOrder, processPayment, shipOrder

// Group 3: Reporting
generateSalesReport, generateUserReport

// Group 4: Communication
sendWelcomeEmail, sendOrderConfirmation

// Group 5: Infrastructure
logActivity, logError, loadConfig, saveConfig
```

**Step 2: Extract Classes**

Create focused classes for each responsibility:

```typescript
// Before: One god class
class ApplicationManager { /* everything */ }

// After: Focused classes
class UserService {
  createUser() { }
  deleteUser() { }
  updateUserProfile() { }
}

class OrderService {
  createOrder() { }
  processPayment() { }
  shipOrder() { }
}

class ReportingService {
  generateSalesReport() { }
  generateUserReport() { }
}

class EmailService {
  sendWelcomeEmail() { }
  sendOrderConfirmation() { }
}
```

**Step 3: Wire Dependencies**

```typescript
// Compose the services
class Application {
  constructor(
    private users: UserService,
    private orders: OrderService,
    private reports: ReportingService,
    private email: EmailService
  ) {}
}
```

### Safe Extraction Process

1. **Write characterization tests** for methods you'll move
2. **Create new class** with extracted methods (copy, don't move yet)
3. **Have god class delegate** to new class
4. **Run tests** - behavior unchanged
5. **Update callers** to use new class directly
6. **Remove delegation** from god class
7. **Run tests** - still working

## Spaghetti Code

### Recognition

Spaghetti code has no clear flow or structure.

**Symptoms:**

- Deep nesting (5+ levels)
- Long methods (100+ lines)
- Variables reused for different purposes
- Control flow is hard to follow
- Copy-paste with slight variations
- "Clever" code that requires explanation

**Example:**

```typescript
// Spaghetti: What does this even do?
function process(data: any) {
  let result = null;
  let temp = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].type === 'A') {
      if (data[i].value > 100) {
        temp = data[i].value * 0.9;
        if (data[i].special) {
          temp = temp - 10;
          if (temp < 0) {
            temp = 0;
          }
        }
      } else {
        temp = data[i].value;
      }
    } else if (data[i].type === 'B') {
      temp = data[i].value * 1.1;
      if (data[i].discount) {
        temp = temp * 0.8;
      }
    } else {
      if (data[i].value > 50) {
        temp = data[i].value * 0.95;
      } else {
        temp = data[i].value;
      }
    }
    if (result === null) {
      result = temp;
    } else {
      result = result + temp;
    }
  }
  return result;
}
```

### Remediation Strategy

**Step 1: Flatten Nesting with Guard Clauses**

```typescript
// Before: Nested
if (condition1) {
  if (condition2) {
    if (condition3) {
      doSomething();
    }
  }
}

// After: Guard clauses
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
doSomething();
```

**Step 2: Extract Methods**

```typescript
// Before: All in one
function process(data: any) {
  // 100 lines of type-checking, calculation, aggregation
}

// After: Composed of smaller functions
function process(items: Item[]): number {
  return items
    .map(calculateItemValue)
    .reduce((sum, value) => sum + value, 0);
}

function calculateItemValue(item: Item): number {
  switch (item.type) {
    case 'A': return calculateTypeA(item);
    case 'B': return calculateTypeB(item);
    default: return calculateDefault(item);
  }
}

function calculateTypeA(item: Item): number {
  const baseValue = item.value > 100 ? item.value * 0.9 : item.value;
  return item.special ? Math.max(0, baseValue - 10) : baseValue;
}
```

**Step 3: Use Meaningful Names**

```typescript
// Before: Cryptic
let temp = 0;
let result = null;

// After: Descriptive
let discountedPrice = 0;
let totalOrderValue = 0;
```

### De-Spaghettification Checklist

- [ ] Replace nested ifs with guard clauses
- [ ] Extract methods for each logical block
- [ ] Rename variables to explain purpose
- [ ] Remove "clever" code in favor of clear code
- [ ] Replace magic numbers with named constants
- [ ] Add types to catch errors

## Shotgun Surgery

### Recognition

A single change requires editing many different classes.

**Symptoms:**

- Simple feature requires touching 10+ files
- Related code is scattered across the codebase
- Copy-paste is common (same logic in multiple places)
- Changes frequently introduce bugs in unexpected places

**Example:**

Adding a new customer type requires changes in:

- `CustomerValidator.ts`
- `CustomerRepository.ts`
- `CustomerSerializer.ts`
- `CustomerController.ts`
- `CustomerView.ts`
- `CustomerReport.ts`
- `CustomerExport.ts`
- ... and more

### Remediation Strategy

**Move Method/Field to Consolidate**

```typescript
// Before: Scattered across files
class CustomerValidator {
  validatePremium(c: Customer) { /* premium rules */ }
}
class CustomerPricing {
  calculatePremiumPrice(c: Customer) { /* premium pricing */ }
}
class CustomerReport {
  formatPremium(c: Customer) { /* premium format */ }
}

// After: Consolidated
class PremiumCustomer extends Customer {
  validate() { /* premium rules */ }
  calculatePrice() { /* premium pricing */ }
  format() { /* premium format */ }
}
```

**Inline Class (then re-extract properly)**

Sometimes you need to inline scattered code, then re-extract with better boundaries:

```typescript
// Step 1: Inline everything to one place (temporarily worse)
class CustomerOperations {
  // All validation, pricing, formatting in one place
}

// Step 2: Re-extract with proper boundaries
class Customer {
  validate() { }
  calculatePrice() { }
}
class CustomerFormatter {
  format(customer: Customer) { }
}
```

## Primitive Obsession

### Recognition

Using primitives instead of small objects for simple tasks.

**Symptoms:**

- Phone numbers, emails, money as strings
- Validation logic repeated everywhere
- Formatting logic scattered
- Type confusion (is this string a URL or a filename?)

**Example:**

```typescript
// Primitive obsession
function processOrder(
  customerId: string,      // What format?
  email: string,           // Is it validated?
  phone: string,           // What format?
  amount: number,          // What currency?
  date: string             // What format?
) { }
```

### Remediation Strategy

**Replace Primitive with Object**

```typescript
// Value objects with validation and behavior
class CustomerId {
  constructor(private value: string) {
    if (!/^CUS-\d{6}$/.test(value)) {
      throw new Error('Invalid customer ID format');
    }
  }
  toString() { return this.value; }
}

class Email {
  constructor(private value: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error('Invalid email format');
    }
  }
  get domain() { return this.value.split('@')[1]; }
}

class Money {
  constructor(
    private amount: number,
    private currency: string
  ) {}

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}

// Now type-safe and self-validating
function processOrder(
  customerId: CustomerId,
  email: Email,
  phone: PhoneNumber,
  amount: Money,
  date: OrderDate
) { }
```

## Quick Reference: Anti-Pattern Decision Tree

```
Is the code hard to understand?
├─► Deep nesting → Apply Guard Clauses
├─► Long methods → Extract Function
├─► Cryptic names → Rename
└─► All of above → Spaghetti Code remediation

Is one class doing too much?
├─► Many unrelated methods → God Class remediation
├─► Hundreds of lines → Extract Classes
└─► Vague name (Manager, Helper) → Identify and split responsibilities

Does a change touch many files?
├─► Related logic scattered → Move to consolidate
├─► Same code in multiple places → Extract shared module
└─► Use systems-thinking skill → Find all instances

Are you using primitives for domain concepts?
├─► Strings for IDs, emails, phones → Value Objects
├─► Numbers for money → Money class
└─► Strings for dates → Date/Time objects
```

## The Economics of Remediation

Not all anti-patterns need immediate fixing:

|Fix Now|Fix When Touched|Live With It|
|---|---|---|
|Blocking new features|Annoying but workable|Isolated, rarely changed|
|Causing bugs|Slows development|End-of-life code|
|Team can't understand|Adds friction|Low-risk area|

> "The best time to plant a tree was 20 years ago.
> The second best time is now."
> — But also: "Don't gold-plate code that's being deleted next quarter."
