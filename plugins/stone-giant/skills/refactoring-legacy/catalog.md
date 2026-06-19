# Refactoring Catalog

> "A refactoring is a change made to the internal structure of software to make
> it easier to understand and cheaper to modify without changing its observable
> behavior."
> — Martin Fowler

This catalog covers the most commonly needed refactorings, organized by purpose.

## Composing Methods

### Extract Function

**When to use:** A code fragment that can be grouped together.

**Motivation:** Short, well-named functions are easier to understand and reuse.

```typescript
// BEFORE
function printOwing(invoice: Invoice) {
  let outstanding = 0;

  console.log('***********************');
  console.log('**** Customer Owes ****');
  console.log('***********************');

  // Calculate outstanding
  for (const order of invoice.orders) {
    outstanding += order.amount;
  }

  // Print details
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}

// AFTER
function printOwing(invoice: Invoice) {
  printBanner();
  const outstanding = calculateOutstanding(invoice);
  printDetails(invoice, outstanding);
}

function printBanner() {
  console.log('***********************');
  console.log('**** Customer Owes ****');
  console.log('***********************');
}

function calculateOutstanding(invoice: Invoice): number {
  return invoice.orders.reduce((sum, order) => sum + order.amount, 0);
}

function printDetails(invoice: Invoice, outstanding: number) {
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}
```

**Mechanics:**

1. Create new function, name it by what it does (not how)
2. Copy extracted code to new function
3. Pass needed variables as parameters
4. Replace original code with function call
5. Test

### Inline Function

**When to use:** Function body is as clear as its name.

**Motivation:** Remove needless indirection.

```typescript
// BEFORE
function getRating(driver: Driver): number {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1;
}

function moreThanFiveLateDeliveries(driver: Driver): boolean {
  return driver.lateDeliveries > 5;
}

// AFTER
function getRating(driver: Driver): number {
  return driver.lateDeliveries > 5 ? 2 : 1;
}
```

### Extract Variable

**When to use:** Complex expression that's hard to understand.

**Motivation:** Break down complex expressions, add explanatory names.

```typescript
// BEFORE
return order.quantity * order.itemPrice -
  Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
  Math.min(order.quantity * order.itemPrice * 0.1, 100);

// AFTER
const basePrice = order.quantity * order.itemPrice;
const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
const shipping = Math.min(basePrice * 0.1, 100);
return basePrice - quantityDiscount + shipping;
```

## Moving Features

### Move Function

**When to use:** Function uses more features of another class than its own.

**Motivation:** Keep related code together.

```typescript
// BEFORE: trackSummary uses account more than it uses anything in its own class
class Tracker {
  trackSummary(points: Point[]): Summary {
    const totalTime = this.calculateTime(points);
    const totalDistance = this.calculateDistance(points);
    const pace = totalTime / 60 / totalDistance;
    return { time: totalTime, distance: totalDistance, pace };
  }
}

// AFTER: Move to where the data lives
class Points {
  constructor(private points: Point[]) {}

  get summary(): Summary {
    const totalTime = this.calculateTime();
    const totalDistance = this.calculateDistance();
    const pace = totalTime / 60 / totalDistance;
    return { time: totalTime, distance: totalDistance, pace };
  }
}
```

### Move Field

**When to use:** Field is used more by another class.

```typescript
// BEFORE
class Customer {
  discountRate: number;
}

class CustomerContract {
  constructor(private customer: Customer) {}

  get discount() {
    return this.customer.discountRate; // Always reaching into Customer
  }
}

// AFTER
class Customer {
  constructor(private contract: CustomerContract) {}

  get discountRate() {
    return this.contract.discountRate;
  }
}

class CustomerContract {
  discountRate: number; // Now lives here
}
```

## Organizing Data

### Replace Primitive with Object

**When to use:** Primitive with behavior or validation needs.

```typescript
// BEFORE: Phone number as string
class Person {
  homePhone: string;
}

// Problems: No validation, formatting logic scattered

// AFTER: Phone number as object
class PhoneNumber {
  constructor(private value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid phone number');
    }
  }

  private isValid(value: string): boolean {
    return /^\d{3}-\d{3}-\d{4}$/.test(value);
  }

  get areaCode(): string {
    return this.value.slice(0, 3);
  }

  toString(): string {
    return this.value;
  }
}

class Person {
  homePhone: PhoneNumber;
}
```

### Replace Temp with Query

**When to use:** Temporary variable holds expression result used once.

```typescript
// BEFORE
function getPrice(order: Order): number {
  const basePrice = order.quantity * order.itemPrice;
  const discountFactor = 0.98;
  return basePrice * discountFactor;
}

// AFTER
function getPrice(order: Order): number {
  return basePrice(order) * discountFactor();
}

function basePrice(order: Order): number {
  return order.quantity * order.itemPrice;
}

function discountFactor(): number {
  return 0.98;
}
```

## Simplifying Conditional Logic

### Decompose Conditional

**When to use:** Complex conditional with complicated branches.

```typescript
// BEFORE
if (date < SUMMER_START || date > SUMMER_END) {
  charge = quantity * winterRate + winterServiceCharge;
} else {
  charge = quantity * summerRate;
}

// AFTER
if (isSummer(date)) {
  charge = summerCharge(quantity);
} else {
  charge = winterCharge(quantity);
}

function isSummer(date: Date): boolean {
  return date >= SUMMER_START && date <= SUMMER_END;
}

function summerCharge(quantity: number): number {
  return quantity * summerRate;
}

function winterCharge(quantity: number): number {
  return quantity * winterRate + winterServiceCharge;
}
```

### Replace Conditional with Polymorphism

**When to use:** Conditional that chooses behavior based on type.

```typescript
// BEFORE
function getSpeed(vehicle: Vehicle): number {
  switch (vehicle.type) {
    case 'car':
      return vehicle.horsepower * 0.5;
    case 'bicycle':
      return vehicle.gears * 2;
    case 'boat':
      return vehicle.propellers * 10;
    default:
      throw new Error('Unknown vehicle type');
  }
}

// AFTER
abstract class Vehicle {
  abstract getSpeed(): number;
}

class Car extends Vehicle {
  constructor(private horsepower: number) { super(); }

  getSpeed(): number {
    return this.horsepower * 0.5;
  }
}

class Bicycle extends Vehicle {
  constructor(private gears: number) { super(); }

  getSpeed(): number {
    return this.gears * 2;
  }
}

class Boat extends Vehicle {
  constructor(private propellers: number) { super(); }

  getSpeed(): number {
    return this.propellers * 10;
  }
}
```

### Replace Nested Conditional with Guard Clauses

**When to use:** Deeply nested conditionals obscure the normal path.

```typescript
// BEFORE
function getPayAmount(employee: Employee): number {
  let result: number;
  if (employee.isSeparated) {
    result = separatedAmount();
  } else {
    if (employee.isRetired) {
      result = retiredAmount();
    } else {
      result = normalPayAmount();
    }
  }
  return result;
}

// AFTER
function getPayAmount(employee: Employee): number {
  if (employee.isSeparated) return separatedAmount();
  if (employee.isRetired) return retiredAmount();
  return normalPayAmount();
}
```

### Introduce Special Case (Null Object)

**When to use:** Many places check for null/special value.

```typescript
// BEFORE: Null checks everywhere
function getCustomerName(site: Site): string {
  const customer = site.customer;
  if (customer === null) return 'occupant';
  return customer.name;
}

function getBillingPlan(site: Site): BillingPlan {
  const customer = site.customer;
  if (customer === null) return BillingPlan.basic();
  return customer.billingPlan;
}

// AFTER: Null Object pattern
class UnknownCustomer implements Customer {
  get name() { return 'occupant'; }
  get billingPlan() { return BillingPlan.basic(); }
}

class Site {
  get customer(): Customer {
    return this._customer ?? new UnknownCustomer();
  }
}

// Now: No null checks needed
function getCustomerName(site: Site): string {
  return site.customer.name;
}
```

## Refactoring APIs

### Separate Query from Modifier

**When to use:** Function returns value AND has side effects.

```typescript
// BEFORE: Query with side effect
function getTotalOutstandingAndSendBill(): number {
  const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  sendBill(total); // Side effect!
  return total;
}

// AFTER: Separated
function totalOutstanding(): number {
  return invoices.reduce((sum, inv) => sum + inv.amount, 0);
}

function sendBill(): void {
  emailService.send(billFor(totalOutstanding()));
}

// Caller now controls when side effect happens
const total = totalOutstanding();
if (shouldSendBill) {
  sendBill();
}
```

### Parameterize Function

**When to use:** Multiple functions doing similar things with different values.

```typescript
// BEFORE
function tenPercentRaise(person: Person) {
  person.salary = person.salary * 1.1;
}

function fivePercentRaise(person: Person) {
  person.salary = person.salary * 1.05;
}

// AFTER
function raise(person: Person, factor: number) {
  person.salary = person.salary * (1 + factor);
}

// Usage
raise(person, 0.10);
raise(person, 0.05);
```

### Replace Parameter with Query

**When to use:** Parameter can be derived from other information.

```typescript
// BEFORE
function finalPrice(basePrice: number, discountLevel: number): number {
  const discount = discountFor(discountLevel);
  return basePrice - discount;
}

// Caller must know discount level
finalPrice(order.basePrice, order.discountLevel);

// AFTER
function finalPrice(order: Order): number {
  const discount = discountFor(order.discountLevel);
  return order.basePrice - discount;
}

// Caller is simpler
finalPrice(order);
```

## Quick Reference: When to Use What

|Smell|Refactoring|
|---|---|
|Long method|Extract Function|
|Complex expression|Extract Variable|
|Feature envy (using other class's data)|Move Function/Field|
|Primitive obsession|Replace Primitive with Object|
|Complex conditional|Decompose Conditional|
|Type-based switch|Replace Conditional with Polymorphism|
|Nested conditionals|Guard Clauses|
|Null checks everywhere|Introduce Special Case|
|Query with side effect|Separate Query from Modifier|
|Similar functions|Parameterize Function|

## The Mechanics Pattern

Every refactoring follows this pattern:

1. **Small step** that preserves behavior
2. **Compile** (catch syntax errors)
3. **Test** (catch behavior changes)
4. **Commit** (create restore point)
5. **Repeat** until complete

> "If it hurts, do it more often, and bring the pain forward."
> — Continuous Delivery principle applied to refactoring
