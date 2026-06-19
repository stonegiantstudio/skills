---
name: postgresql
description: PostgreSQL database design with proper types, naming conventions, indexing strategies, and JSONB patterns. Use when designing schemas, writing DDL, or optimizing PostgreSQL databases.
metadata:
  triggers:
    patterns:
      - "postgresql"
      - "postgres"
      - "psql"
      - "CREATE TABLE"
      - "ALTER TABLE"
      - "TIMESTAMPTZ"
      - "JSONB"
      - "pg_"
---

# PostgreSQL Database Design

Database design guidance specific to PostgreSQL.

## CRITICAL: Verify Before Writing SQL

**NEVER guess object names.** Before writing any DDL or DML:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Search for tables by pattern
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%user%';

-- Get columns for a table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Get foreign keys for a table
SELECT
  kcu.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.key_column_usage kcu
JOIN information_schema.constraint_column_usage ccu
  ON kcu.constraint_name = ccu.constraint_name
JOIN information_schema.table_constraints tc
  ON kcu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.table_name = 'posts';

-- Get indexes for a table
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';

-- Get constraints for a table
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass;
```

---

## PostgreSQL Strengths

What makes PostgreSQL unique among relational databases:

| Feature | Description |
|---------|-------------|
| **JSONB** | Binary JSON with indexing, containment operators, and path queries |
| **Native UUID** | First-class UUID type with `gen_random_uuid()` |
| **Native BOOLEAN** | True boolean type (not 0/1 integers) |
| **Arrays** | Native array types: `TEXT[]`, `INTEGER[]`, etc. |
| **TIMESTAMPTZ** | Timezone-aware timestamps (stores UTC, converts on display) |
| **Partial Indexes** | Index only rows matching a WHERE clause |
| **ENUM Types** | Type-safe enumerations at the database level |
| **Full ALTER TABLE** | Add/drop/modify columns and constraints on existing tables |
| **MVCC** | Multi-Version Concurrency Control for concurrent writes without locking |
| **Generated Columns** | Computed columns stored or virtual |
| **Row Level Security** | Fine-grained access control at the row level |
| **Table Partitioning** | Native range, list, and hash partitioning |

---

## Data Types

### Preferred Types

| Use Case | Type | Notes |
|----------|------|-------|
| Text (any length) | `TEXT` | No performance difference vs VARCHAR in PostgreSQL |
| Text (with limit) | `VARCHAR(n)` | Only when you need to enforce max length |
| Timestamps | `TIMESTAMPTZ` | **Always** use this, never `TIMESTAMP` |
| Boolean | `BOOLEAN` | Native true/false |
| Integer | `INTEGER` | -2B to +2B |
| Large integer | `BIGINT` | For IDs, counts that may exceed 2B |
| Money/currency | `NUMERIC(precision, scale)` | **Never** use FLOAT for money |
| JSON data | `JSONB` | **Always** use this, never `JSON` |
| Unique identifier | `UUID` | Use with `gen_random_uuid()` |
| Arrays | `TEXT[]`, `INTEGER[]` | Native array support |

### Primary Keys

```sql
-- UUID (recommended for most tables)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Auto-increment (modern syntax)
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY

-- NEVER use SERIAL (deprecated)
-- id SERIAL PRIMARY KEY  -- DON'T DO THIS
```

**UUID benefits:**

- No sequential ID enumeration attacks
- Safe for distributed systems
- Can generate client-side

**BIGINT IDENTITY benefits:**

- Smaller storage (8 bytes vs 16)
- Better index locality for time-ordered data
- Simpler debugging

### Timestamps

```sql
-- ALWAYS use TIMESTAMPTZ
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at TIMESTAMPTZ  -- nullable for soft deletes

-- NEVER use TIMESTAMP (loses timezone info)
-- created_at TIMESTAMP  -- DON'T DO THIS
```

---

## Naming Conventions

Based on [Simon Holywell's SQL Style Guide](https://www.sqlstyle.guide/).

### Tables

- **Plural**, snake_case
- Describes the collection of entities

```sql
users
blog_posts
order_line_items

-- Junction tables: both entity names (alphabetical or logical order)
user_roles
post_tags
```

### Columns

- **Singular**, snake_case
- **No table name prefix** (avoid `user_name` in `users` table)
- Descriptive and unambiguous

```sql
-- Primary key
id

-- Foreign keys: singular_entity_id
user_id
organization_id

-- Booleans: is_, has_, can_, should_
is_active
has_verified_email
can_publish
should_notify

-- Timestamps: _at suffix
created_at
updated_at
published_at
expires_at

-- Counts: _count suffix
view_count
comment_count

-- Status/state: _status suffix
order_status
payment_status
```

### Indexes

```sql
-- Pattern: {table}_{columns}_idx
users_email_idx
posts_user_id_idx
orders_customer_id_status_idx

-- Unique indexes
users_email_unique_idx

-- Partial indexes (include condition hint)
posts_published_at_active_idx
```

### Constraints

```sql
-- Primary key: {table}_pkey
users_pkey

-- Foreign key: {table}_{column}_fkey
posts_user_id_fkey

-- Unique: {table}_{columns}_key
users_email_key

-- Check: {table}_{column}_check or {table}_{description}_check
orders_quantity_check
orders_dates_valid_check

-- Exclusion: {table}_{description}_excl
reservations_no_overlap_excl
```

---

## Standard Table Template

```sql
-- Create ENUM type if needed
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE posts (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys (always indexed separately)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    -- Business columns
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,

    -- Enum column
    status post_status NOT NULL DEFAULT 'draft',

    -- Boolean flags
    is_featured BOOLEAN NOT NULL DEFAULT false,

    -- JSONB for flexible data
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    -- Named constraints
    CONSTRAINT posts_title_check CHECK (char_length(title) >= 1),
    CONSTRAINT posts_slug_key UNIQUE (slug)
);

-- Always index foreign keys
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_category_id_idx ON posts(category_id);

-- Index commonly filtered columns
CREATE INDEX posts_status_idx ON posts(status);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);

-- Partial index for active records only
CREATE INDEX posts_published_at_active_idx ON posts(published_at)
    WHERE status = 'published';

-- GIN index for JSONB queries
CREATE INDEX posts_metadata_idx ON posts USING GIN (metadata);
```

---

## Indexing Strategies

### Index Types

| Type | Use Case | Example |
|------|----------|---------|
| **B-tree** (default) | Equality, range, sorting | `CREATE INDEX ... ON table(column)` |
| **GIN** | JSONB, arrays, full-text | `CREATE INDEX ... USING GIN (jsonb_col)` |
| **GiST** | Geometric, range types, full-text | `CREATE INDEX ... USING GiST (geo_col)` |
| **Hash** | Equality only (rarely better than B-tree) | `CREATE INDEX ... USING HASH (col)` |
| **BRIN** | Very large tables with natural ordering | `CREATE INDEX ... USING BRIN (created_at)` |

### B-tree Index Examples

```sql
-- Single column
CREATE INDEX users_email_idx ON users(email);

-- Composite (order matters for queries)
CREATE INDEX orders_customer_status_idx ON orders(customer_id, status);

-- Descending (for ORDER BY col DESC)
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);

-- Unique
CREATE UNIQUE INDEX users_email_unique_idx ON users(email);
```

### Partial Indexes

Index only rows matching a condition - smaller and faster:

```sql
-- Only index active users
CREATE INDEX users_email_active_idx ON users(email)
    WHERE is_active = true;

-- Only index published posts
CREATE INDEX posts_published_idx ON posts(published_at)
    WHERE status = 'published';

-- Only index non-null values
CREATE INDEX orders_shipped_at_idx ON orders(shipped_at)
    WHERE shipped_at IS NOT NULL;
```

### Expression Indexes

Index computed values:

```sql
-- Case-insensitive email lookup
CREATE INDEX users_email_lower_idx ON users(LOWER(email));

-- Extract year from timestamp
CREATE INDEX posts_year_idx ON posts(EXTRACT(YEAR FROM created_at));

-- JSONB field extraction
CREATE INDEX posts_author_idx ON posts((metadata->>'author'));
```

### GIN Indexes for JSONB

```sql
-- Index entire JSONB document (supports @>, ?, ?&, ?|)
CREATE INDEX posts_metadata_idx ON posts USING GIN (metadata);

-- Index specific JSONB path (smaller, faster for specific queries)
CREATE INDEX posts_tags_idx ON posts USING GIN ((metadata->'tags'));
```

### What to Index

**Always index:**

- Foreign key columns (PostgreSQL doesn't auto-index these!)
- Columns in WHERE clauses
- Columns in JOIN conditions
- Columns in ORDER BY (consider DESC if needed)

**Consider indexing:**

- Columns with high selectivity (many unique values)
- JSONB columns you query with @>, ?, etc.

**Avoid indexing:**

- Low-selectivity columns (boolean with 50/50 distribution)
- Frequently updated columns (index maintenance overhead)
- Small tables (sequential scan may be faster)

---

## JSONB Patterns

### When to Use JSONB vs Normalized Tables

**Use JSONB for:**

- Truly dynamic/schemaless data
- Configuration/settings
- Metadata/tags that vary per record
- Third-party API responses you need to store
- Audit logs with varying payloads

**Use normalized tables for:**

- Data you query/filter frequently
- Data with relationships to other tables
- Data that needs referential integrity
- Reports/analytics

### JSONB Operators

```sql
-- Get JSON object field (returns JSONB)
SELECT metadata->'author' FROM posts;

-- Get JSON field as text (returns TEXT)
SELECT metadata->>'author' FROM posts;

-- Get nested field
SELECT metadata->'author'->>'name' FROM posts;
SELECT metadata#>>'{author,name}' FROM posts;  -- path syntax

-- Check if key exists
SELECT * FROM posts WHERE metadata ? 'featured';

-- Check if any key exists
SELECT * FROM posts WHERE metadata ?| array['featured', 'promoted'];

-- Check if all keys exist
SELECT * FROM posts WHERE metadata ?& array['author', 'tags'];

-- Containment (JSONB contains this structure)
SELECT * FROM posts WHERE metadata @> '{"status": "featured"}';

-- Contained by (this structure contains JSONB)
SELECT * FROM posts WHERE '{"a":1, "b":2}' <@ metadata;
```

### JSONB Querying Examples

```sql
-- Filter by JSON field value
SELECT * FROM posts
WHERE metadata->>'author' = 'John';

-- Filter by nested JSON value
SELECT * FROM posts
WHERE metadata->'settings'->>'theme' = 'dark';

-- Filter by JSON array containment
SELECT * FROM posts
WHERE metadata->'tags' @> '["featured"]';

-- Check if array contains value
SELECT * FROM posts
WHERE metadata->'tags' ? 'featured';

-- Cast JSON value to proper type for comparison
SELECT * FROM posts
WHERE (metadata->>'view_count')::int > 100;
```

### JSONB Modification

```sql
-- Set/update a key (jsonb_set)
UPDATE posts
SET metadata = jsonb_set(metadata, '{view_count}', '100')
WHERE id = '...';

-- Merge objects (|| operator)
UPDATE posts
SET metadata = metadata || '{"featured": true, "priority": 1}'
WHERE id = '...';

-- Remove a key (- operator)
UPDATE posts
SET metadata = metadata - 'deprecated_field'
WHERE id = '...';

-- Remove nested key
UPDATE posts
SET metadata = metadata #- '{author,temp_data}'
WHERE id = '...';

-- Append to array
UPDATE posts
SET metadata = jsonb_set(
    metadata,
    '{tags}',
    (metadata->'tags') || '"new-tag"'
)
WHERE id = '...';
```

---

## ENUM Types

### Creating and Using ENUMs

```sql
-- Create ENUM type
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- Use in table
CREATE TABLE posts (
    status post_status NOT NULL DEFAULT 'draft'
);

-- Insert with ENUM
INSERT INTO posts (status) VALUES ('published');

-- Query with ENUM
SELECT * FROM posts WHERE status = 'published';
```

### Modifying ENUMs

```sql
-- Add new value (PostgreSQL 9.1+)
ALTER TYPE post_status ADD VALUE 'scheduled';

-- Add value at specific position
ALTER TYPE post_status ADD VALUE 'scheduled' AFTER 'draft';
ALTER TYPE post_status ADD VALUE 'pending' BEFORE 'published';

-- Rename value (PostgreSQL 10+)
ALTER TYPE post_status RENAME VALUE 'draft' TO 'unpublished';

-- NOTE: You CANNOT remove or reorder ENUM values easily
-- For that, you need to recreate the type
```

### ENUM vs CHECK Constraint

```sql
-- ENUM: Type-safe, shows in schema, harder to modify
status post_status NOT NULL DEFAULT 'draft'

-- CHECK: More flexible, easier to modify, less discoverable
status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived'))
```

---

## Advanced Features (Overview)

### Row Level Security (RLS)

Control row-level access based on user context:

```sql
-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own posts
CREATE POLICY posts_user_isolation ON posts
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: published posts visible to all
CREATE POLICY posts_public_read ON posts
    FOR SELECT
    USING (status = 'published');
```

### Table Partitioning

Split large tables for better performance:

```sql
-- Range partitioning by date
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL,
    data JSONB
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE events_2024_q1 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE events_2024_q2 PARTITION OF events
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
```

### Generated Columns

Computed columns stored or virtual:

```sql
-- Stored generated column (computed on write)
CREATE TABLE products (
    price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    total NUMERIC(10,2) GENERATED ALWAYS AS (price * quantity) STORED
);

-- Use in expressions
ALTER TABLE users
ADD COLUMN full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;
```

### Triggers for updated_at

Auto-update timestamp on row changes:

```sql
-- Create trigger function (once per database)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for each table
CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| `TIMESTAMP` instead of `TIMESTAMPTZ` | Loses timezone, causes bugs | Always use `TIMESTAMPTZ` |
| `JSON` instead of `JSONB` | Can't index, slower queries, no operators | Always use `JSONB` |
| `SERIAL` instead of `IDENTITY` | Deprecated, permission issues | Use `GENERATED ALWAYS AS IDENTITY` |
| `VARCHAR(255)` everywhere | Cargo cult from MySQL | Use `TEXT` or appropriate length |
| Missing FK indexes | Slow JOINs and CASCADE deletes | Always index foreign key columns |
| `FLOAT`/`DOUBLE` for money | Precision errors | Use `NUMERIC(precision, scale)` |
| Unnamed constraints | Hard to modify/reference | Always name constraints |
| `SELECT *` in production | Schema changes break code | List columns explicitly |
| No `NOT NULL` on required fields | Data integrity issues | Default to NOT NULL, allow NULL explicitly |
| Soft deletes without partial index | Queries scan deleted rows | Add partial index `WHERE deleted_at IS NULL` |

---

## Quick Reference

```text
TABLES:      plural, snake_case           users, blog_posts, order_items
COLUMNS:     singular, snake_case         user_id, created_at, is_active
PRIMARY KEY: id (UUID or BIGINT)          id UUID DEFAULT gen_random_uuid()
FOREIGN KEY: singular_entity_id           user_id UUID REFERENCES users(id)
BOOLEAN:     is_/has_/can_ prefix         is_active BOOLEAN DEFAULT false
TIMESTAMP:   _at suffix + TIMESTAMPTZ     created_at TIMESTAMPTZ DEFAULT NOW()
ENUM:        CREATE TYPE + use            status post_status DEFAULT 'draft'
JSON:        JSONB (never JSON)           metadata JSONB DEFAULT '{}'
INDEX:       {table}_{columns}_idx        posts_user_id_idx
CONSTRAINT:  {table}_{cols}_{type}        posts_user_id_fkey, orders_qty_check
```
