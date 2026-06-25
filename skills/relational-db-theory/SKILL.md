---
name: relational-db-theory
description: Universal relational database theory - normalization, keys, constraints, and anti-patterns that apply to ALL relational databases (PostgreSQL, MySQL, SQL Server, SQLite, etc.). Use when designing schemas, reviewing database structures, or discussing relational concepts.
---

# Relational Database Theory

Universal principles that apply to ALL relational databases. This is database-agnostic theory - the foundation that PostgreSQL, MySQL, SQL Server, SQLite, and every other RDBMS builds upon.

Act as a database architect grounded in relational theory. Pragmatic application of proven principles, not academic purity for its own sake.

## The Advisory Board

Imagine Codd, Date, Celko, and Pascal reviewing your schema decisions. See [advisory-board.md](references/advisory-board.md) for their bios and how to channel their wisdom.

**Quick Reference:**

- **E.F. Codd**: Invented the relational model. Ask: "Is this the natural structure of the data?"
- **C.J. Date**: Clarifies what relational theory actually says. Ask: "Do I understand WHY?"
- **Joe Celko**: Set-based SQL patterns. Ask: "Can this be done in one set operation?"
- **Fabian Pascal**: Relational purist. Ask: "Am I enforcing integrity in the database?"

## Core Philosophy

**Data has a natural structure.** The relational model lets you represent that structure directly. If your schema feels awkward, you're probably fighting the natural structure.

**Integrity constraints belong in the database.** The application layer will make mistakes. Multiple applications access the same data. Constraints are business rules encoded in logic.

**Think in sets, not rows.** SQL operates on sets. If you're iterating through cursors, you're writing COBOL with SELECT statements.

**Logical design is about meaning.** Design for what the data means. Optimize for performance only after you have a correct logical design.

---

## Normalization Theory

Normalization eliminates redundancy and prevents update anomalies. Each normal form builds on the previous.

### First Normal Form (1NF)

**Rule**: Atomic values only. No repeating groups.

```text
BAD (violates 1NF):
+----+-------+----------------------+
| id | name  | phone_numbers        |
+----+-------+----------------------+
| 1  | Alice | 555-1234, 555-5678   |  <- Multiple values in one cell
+----+-------+----------------------+

GOOD (1NF):
+----+-------+-------------+
| id | name  | phone       |
+----+-------+-------------+
| 1  | Alice | 555-1234    |
| 1  | Alice | 555-5678    |  <- One value per cell (then normalize further)
+----+-------+-------------+

BETTER (proper design):
users: id, name
phones: id, user_id, phone_number
```

**Violations to watch for:**

- Comma-separated values in a single column
- Arrays stored as delimited strings
- "phone1, phone2, phone3" columns
- JSON arrays when structured data is needed

### Second Normal Form (2NF)

**Rule**: No partial dependencies. Every non-key column must depend on the ENTIRE primary key.

Only applies to composite primary keys.

```text
BAD (violates 2NF):
order_items(order_id, product_id, quantity, product_name, product_price)
                                           ^^^^^^^^^^^^  ^^^^^^^^^^^^^
                                           Depends only on product_id, not the full key

GOOD (2NF):
order_items(order_id, product_id, quantity)
products(product_id, product_name, product_price)
```

**The test**: For each non-key column, ask: "Does this depend on the WHOLE key or just PART of it?"

### Third Normal Form (3NF)

**Rule**: No transitive dependencies. Non-key columns must not depend on other non-key columns.

```text
BAD (violates 3NF):
employees(id, name, department_id, department_name, department_budget)
                                   ^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^
                                   Depends on department_id, not directly on id

GOOD (3NF):
employees(id, name, department_id)
departments(id, name, budget)
```

**The test**: Can you determine a non-key column's value by knowing another non-key column (without the primary key)?

**Memorable rule**: "Every non-key attribute must provide a fact about the key, the whole key, and nothing but the key."

### Boyce-Codd Normal Form (BCNF)

**Rule**: Every determinant must be a candidate key.

A determinant is any column (or set of columns) that uniquely determines another column.

```text
PROBLEMATIC:
student_courses(student_id, course, instructor)
- student_id + course -> instructor (each course section has one instructor)
- instructor -> course (each instructor teaches one course)

The second dependency means instructor determines course,
but instructor is not a candidate key.

RESOLVED:
student_sections(student_id, section_id)
sections(section_id, course, instructor)
```

**When BCNF differs from 3NF**: Usually with overlapping candidate keys.

### Fourth Normal Form (4NF)

**Rule**: No multi-valued dependencies (independent multi-valued facts).

```text
BAD (violates 4NF):
employee_skills_languages(employee_id, skill, language)

If Alice knows Java and Python, and speaks English and Spanish,
this creates: Java/English, Java/Spanish, Python/English, Python/Spanish
The skills and languages are INDEPENDENT - they shouldn't be in the same table.

GOOD (4NF):
employee_skills(employee_id, skill)
employee_languages(employee_id, language)
```

**The test**: Are there two (or more) independent multi-valued facts about the same entity combined in one table?

### Fifth Normal Form (5NF)

**Rule**: No join dependencies. The table cannot be decomposed and reconstructed without loss.

Rarely encountered in practice. If you can split a table into smaller tables and JOIN them back without losing or gaining rows, you should split it.

```text
agents_products_regions(agent, product, region)

If the business rule is:
- Agent A sells Product P
- Agent A covers Region R
- Product P is available in Region R
Then A sells P in R

This can be decomposed:
agent_products(agent, product)
agent_regions(agent, region)
product_regions(product, region)

And JOINed back without loss - so it should be decomposed.
```

### When to Denormalize

Denormalization is a performance optimization, not a design choice. It trades integrity for speed.

**Prerequisites for denormalization:**

1. Measured performance problem (not assumed)
2. Query cannot be optimized another way (indexes, query rewrite)
3. Read-heavy workload where write complexity is acceptable
4. Documented justification
5. Maintained constraint (trigger, materialized view, or documented app responsibility)

```text
LEGITIMATE DENORMALIZATION:
- Caching a computed value that's expensive to calculate
- Storing a full name when first/last are separate (display optimization)
- Materialized views for reporting

ILLEGITIMATE "DENORMALIZATION":
- Didn't know better
- "It's faster" without measurement
- "Joins are slow" (they're usually not)
- "NoSQL does it this way"
```

---

## Keys and Constraints

### Primary Keys

**Every table MUST have a primary key.** This is non-negotiable.

**Natural vs. Surrogate Keys:**

```text
NATURAL KEY:
- Built from business data (SSN, email, ISBN)
- Meaningful to humans
- Can change (and when it does, cascading updates are painful)
- Can be composite

SURROGATE KEY:
- System-generated (auto-increment, UUID)
- Meaningless to humans (good!)
- Never changes
- Always single-column

RECOMMENDATION: Use surrogate keys for most tables.
Keep natural keys as UNIQUE constraints for business lookup.

EXAMPLE:
users(
  id UUID PRIMARY KEY,           -- Surrogate: stable, for relationships
  email VARCHAR UNIQUE NOT NULL  -- Natural: for human lookup, can change
)
```

**Composite Primary Keys:**

Use sparingly. Junction tables are the main legitimate use.

```text
GOOD (junction table):
user_roles(user_id, role_id) PRIMARY KEY(user_id, role_id)

QUESTIONABLE (could use surrogate):
order_items(order_id, line_number, ...)
-- Consider: order_items(id, order_id, ...)
```

### Foreign Keys

**Every relationship MUST have a foreign key constraint.** Referential integrity is the database's job.

```text
-- Always specify ON DELETE behavior
FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE    -- Delete children when parent deleted
  ON DELETE SET NULL   -- Nullify reference when parent deleted
  ON DELETE RESTRICT   -- Prevent deletion if children exist
  ON DELETE NO ACTION  -- Same as RESTRICT (default)
```

**Choosing ON DELETE:**

- **CASCADE**: Composition - child has no meaning without parent (order_items without order)
- **SET NULL**: Optional association - child can exist without parent
- **RESTRICT**: Required association - must handle parent deletion explicitly

### Unique Constraints

Use for candidate keys and business uniqueness rules:

```text
email VARCHAR(255) UNIQUE NOT NULL
-- or
CONSTRAINT uq_users_email UNIQUE (email)

-- Composite unique:
CONSTRAINT uq_org_member UNIQUE (organization_id, user_id)
```

### Check Constraints

Encode business rules directly:

```text
-- Range validation
CHECK (quantity > 0)
CHECK (price >= 0)

-- Enum simulation
CHECK (status IN ('draft', 'published', 'archived'))

-- Cross-column validation
CHECK (end_date >= start_date)

-- Format validation
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
```

### NOT NULL Discipline

**Default to NOT NULL.** Make nullability an explicit choice.

```text
-- Ask for each column:
-- "Can this legitimately have no value, ever?"

name VARCHAR(100) NOT NULL,        -- Everyone has a name
middle_name VARCHAR(100),          -- NULL is legitimate (no middle name)
created_at TIMESTAMP NOT NULL,     -- Always has creation time
deleted_at TIMESTAMP,              -- NULL means not deleted
```

**Problems with NULL:**

- Three-valued logic (TRUE, FALSE, UNKNOWN)
- NULL = NULL is UNKNOWN, not TRUE
- Aggregates ignore NULLs (sometimes surprising)
- Indexes may or may not include NULLs

**When NULL is appropriate:**

- Optional relationships (nullable foreign key)
- Unknown values (birth_date for some people)
- Not-yet-set future values (shipped_at before shipping)
- Soft delete patterns (deleted_at)

---

## Anti-Patterns

### Entity-Attribute-Value (EAV)

The most common schema anti-pattern. Avoids proper table design in favor of "flexibility."

```text
BAD (EAV):
entity_attributes(
  entity_id INT,
  attribute_name VARCHAR,
  attribute_value VARCHAR
)

-- "Stores anything!" but:
-- - No type safety (everything is VARCHAR)
-- - No constraints (can't enforce required fields)
-- - Terrible query performance (pivot every query)
-- - No referential integrity
-- - No documentation (what attributes exist?)

GOOD (proper tables):
products(id, name, price, weight, category_id)
-- If truly variable attributes needed, use typed columns + JSONB for extras
```

**When EAV seems tempting**, ask:

- Can I enumerate the attributes? (Then create columns)
- Are attributes truly unlimited and unknowable? (Rare; maybe JSONB for extras)
- Am I building a forms engine? (Different problem entirely)

### Polymorphic Foreign Keys

A single foreign key that can point to multiple tables.

```text
BAD:
comments(
  id,
  content,
  commentable_type VARCHAR,  -- 'post', 'photo', 'video'
  commentable_id INT         -- FK to... which table?
)
-- No referential integrity possible!
-- commentable_id 42 might not exist in any table

GOOD (separate FKs):
comments(
  id,
  content,
  post_id INT REFERENCES posts(id),
  photo_id INT REFERENCES photos(id),
  video_id INT REFERENCES videos(id),
  CHECK (
    (post_id IS NOT NULL)::int +
    (photo_id IS NOT NULL)::int +
    (video_id IS NOT NULL)::int = 1
  )
)

ALSO GOOD (junction tables):
post_comments(post_id, comment_id)
photo_comments(photo_id, comment_id)
```

### God Tables

Tables with too many columns, mixing multiple concerns.

```text
BAD:
users(
  id, name, email, password_hash,
  shipping_street, shipping_city, shipping_state, shipping_zip,
  billing_street, billing_city, billing_state, billing_zip,
  company_name, company_tax_id, company_industry,
  preferences_theme, preferences_language, preferences_timezone,
  ... 50 more columns
)

GOOD (decomposed):
users(id, name, email, password_hash)
user_addresses(id, user_id, type, street, city, state, zip)
user_companies(user_id, name, tax_id, industry)
user_preferences(user_id, theme, language, timezone)
```

**Signs of a god table:**

- More than 20-30 columns
- Groups of related columns (address1, address2, ...)
- Many nullable columns (often means optional sub-entity)
- Table name is vague ("data", "records", "entities")

### Missing Constraints (App-Layer Enforcement)

Relying on the application to enforce rules that should be in the database.

```text
BAD:
CREATE TABLE orders (
  id INT,
  quantity INT,        -- App checks quantity > 0
  status VARCHAR       -- App checks valid statuses
);
-- Another app forgets the checks. Import script forgets.
-- Data migration forgets. Now you have quantity = -5.

GOOD:
CREATE TABLE orders (
  id INT PRIMARY KEY,
  quantity INT NOT NULL CHECK (quantity > 0),
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'confirmed', 'shipped'))
);
-- Database enforces. Always. Every application. Every script.
```

**Pascal's Law**: "The app layer will make mistakes."

### NULL Abuse

Using NULL for multiple meanings.

```text
BAD:
deleted_at TIMESTAMP  -- NULL means "not deleted"... or "unknown"?
price NUMERIC         -- NULL means "free"? "unknown"? "not for sale"?

GOOD:
is_deleted BOOLEAN NOT NULL DEFAULT false
deleted_at TIMESTAMP  -- Only set when is_deleted = true

price NUMERIC NOT NULL CHECK (price >= 0)  -- 0 for free
is_for_sale BOOLEAN NOT NULL DEFAULT true  -- Explicit availability
```

**Each NULL should have exactly one meaning**, and that meaning should be "not applicable" or "unknown."

---

## Query Patterns

### Set-Based Thinking

**Wrong mental model**: "For each row, do something"
**Right mental model**: "From this set, produce that set"

```sql
-- BAD (procedural thinking)
-- "Loop through orders, check each one, update if needed"
DECLARE cursor...
FETCH...
IF...
UPDATE...

-- GOOD (set thinking)
-- "Update the set of orders that match this condition"
UPDATE orders
SET status = 'overdue'
WHERE due_date < CURRENT_DATE
  AND status = 'pending';
```

### Common Set Operations

```sql
-- All from A, plus all from B (deduplicated)
SELECT id FROM customers UNION SELECT id FROM prospects

-- All from A, plus all from B (keep duplicates)
SELECT item FROM sales UNION ALL SELECT item FROM returns

-- In A but not in B
SELECT id FROM current_members
EXCEPT SELECT id FROM expired_members

-- In both A and B
SELECT id FROM email_subscribers
INTERSECT SELECT id FROM purchasers
```

### JOIN Strategy

**Start with the table you're filtering, join outward.**

```sql
-- If filtering by user, start with users
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id;

-- If filtering by order, start with orders
SELECT o.id, u.name
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'pending';
```

**Choose the right JOIN:**

- **INNER JOIN**: Only rows with matches in both tables
- **LEFT JOIN**: All rows from left table, NULLs for unmatched right
- **RIGHT JOIN**: (Rarely used - rewrite as LEFT JOIN for readability)
- **FULL OUTER JOIN**: All rows from both, NULLs for unmatched

### Avoid These Patterns

```sql
-- BAD: SELECT *
SELECT * FROM orders  -- Schema changes break code

-- GOOD: Explicit columns
SELECT id, user_id, total, status FROM orders

-- BAD: Implicit join (comma syntax)
SELECT * FROM orders, users WHERE orders.user_id = users.id

-- GOOD: Explicit JOIN
SELECT * FROM orders JOIN users ON orders.user_id = users.id

-- BAD: Not using GROUP BY correctly
SELECT user_id, MAX(created_at), status  -- status is undefined!
FROM orders
GROUP BY user_id

-- GOOD: All non-aggregated columns in GROUP BY
SELECT user_id, status, MAX(created_at)
FROM orders
GROUP BY user_id, status
```

### Subqueries vs. JOINs vs. CTEs

```sql
-- Subquery in WHERE (correlated - runs once per outer row, often slow)
SELECT * FROM orders o
WHERE total > (SELECT AVG(total) FROM orders WHERE user_id = o.user_id)

-- Subquery in FROM (derived table - runs once, then joined)
SELECT o.*, user_avg.avg_total
FROM orders o
JOIN (
  SELECT user_id, AVG(total) as avg_total
  FROM orders GROUP BY user_id
) user_avg ON user_avg.user_id = o.user_id
WHERE o.total > user_avg.avg_total

-- CTE (Common Table Expression - clearest, same as derived table)
WITH user_averages AS (
  SELECT user_id, AVG(total) as avg_total
  FROM orders
  GROUP BY user_id
)
SELECT o.*, ua.avg_total
FROM orders o
JOIN user_averages ua ON ua.user_id = o.user_id
WHERE o.total > ua.avg_total
```

**Prefer CTEs for complex queries** - they're readable and maintainable.

---

## Expand-Contract Completeness

The expand-contract pattern uses two PRs: expand (add new structure,
dual-write) then contract (remove old structure). The contract phase
frequently misses dependent objects — stored procedures, views, functions,
and triggers that still reference the dropped column or table.

### Pre-Contract Verification Checklist

Before writing a contract migration that drops a column, renames a table,
or alters a column type:

1. **Identify the target.** Which column or table is being dropped/renamed?
   Example: dropping `Projects.LegacyRate`.

2. **Grep stored procedures and views** for references to the target:

   ```bash
   grep -r "LegacyRate" flyway/sql/R__*
   ```

   If any R__ file still references the target, it will break at deploy
   time when Flyway re-runs it after the contract migration.

3. **Grep application code** for the column or table name:

   ```bash
   grep -r "LegacyRate" src/ --include="*.ts" --include="*.tsx"
   ```

   Check loaders, actions, model files, and type definitions. Also check
   Prisma schema if the column is mapped there.

4. **Verify dual-writes are removed.** The expand PR added writes to both
   old and new structures. The contract PR must remove the old writes —
   otherwise you're writing to a column that no longer exists.

5. **Test the contract in isolation.** Apply the expand migration, then
   the contract migration, then run all dependent stored procedures and
   views to confirm they compile and return correct results.

   ```bash
   pnpm migrate:local           # Apply expand + contract
   pnpm flycheck:all            # Lint all migrations
   # Manually test affected R__ procedures in the local database
   ```

Every dependent object must be either updated to use the new structure
or confirmed as dead code that can be removed alongside the contract.

---

## Design Checklist

Before finalizing any schema:

```text
STRUCTURE
[ ] Does every table have a primary key?
[ ] Are all foreign keys declared with constraints?
[ ] Is the schema at least in 3NF? (If not, document why)
[ ] Are there no repeating groups? (1NF)
[ ] No partial dependencies on composite keys? (2NF)
[ ] No transitive dependencies? (3NF)

INTEGRITY
[ ] Are NOT NULL constraints applied appropriately?
[ ] Are CHECK constraints used for business rules?
[ ] Are UNIQUE constraints used for candidate keys?
[ ] Is ON DELETE behavior specified for all FKs?

ANTI-PATTERNS
[ ] No EAV tables without strong justification?
[ ] No polymorphic foreign keys?
[ ] No "god tables" with 30+ columns?
[ ] No comma-separated values in columns?
[ ] No business logic deferred to app layer?

NAMING
[ ] Are table names plural nouns? (users, orders)
[ ] Are column names singular? (user_id, not users_id)
[ ] Are constraints named? (fk_orders_user_id, not auto-generated)
[ ] Do names reflect business meaning?

DOCUMENTATION
[ ] Is any denormalization documented with justification?
[ ] Are non-obvious constraints explained?
[ ] Are NULL meanings documented?
```

---

## Quick Reference

```text
NORMAL FORMS:
1NF - Atomic values, no repeating groups
2NF - No partial dependencies (full key dependency)
3NF - No transitive dependencies (non-key -> non-key)
BCNF - Every determinant is a candidate key
4NF - No multi-valued dependencies
5NF - No join dependencies

KEYS:
Primary Key - Unique identifier, never null, immutable
Foreign Key - References another table's primary key
Candidate Key - Could be primary key (unique, not null)
Surrogate Key - System-generated, meaningless
Natural Key - Business data, meaningful

CONSTRAINTS:
PRIMARY KEY - Unique, not null identifier
FOREIGN KEY - Referential integrity
UNIQUE - No duplicates allowed
CHECK - Business rule validation
NOT NULL - Value required

ANTI-PATTERNS:
EAV - Fake "flexibility", no type safety
Polymorphic FK - FK to multiple tables, no integrity
God Table - Too many columns, mixed concerns
App-Layer Enforcement - Constraints not in DB
NULL Abuse - Multiple meanings for NULL

SET THINKING:
"For each row" -> "From this set, produce that set"
Cursor loop -> Single UPDATE/DELETE with WHERE
Multiple queries -> Single query with JOINs
```
