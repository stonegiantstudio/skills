---
name: drizzle-migrations
description: Manages Drizzle ORM migrations with PostgreSQL for multi-environment setups (local/staging/production). Use when working with drizzle-kit, schema syncing, or migration workflows.
metadata:
  triggers:
    patterns:
      - "drizzle.config.ts"
      - "**/schema.ts"
      - "drizzle/**/*.sql"
    keywords:
      - "drizzle"
      - "drizzle-kit"
      - "migration"
      - "schema sync"
      - "database sync"
---

# Drizzle Migrations

Manages Drizzle ORM migrations with PostgreSQL for multi-environment setups (local/staging/production).

## CRITICAL: AI Must NEVER Run `drizzle-kit push`

**`drizzle-kit push` has interactive prompts that WILL hang in automated environments.**

AI agents must:

1. **Always use `generate` + `migrate`** for schema changes
2. **Never execute `push`** directly - it will freeze waiting for user input
3. **If push is truly needed**, instruct the user to run it manually (see below)

## Core Commands

| Command | Purpose | AI Can Run? |
|---------|---------|-------------|
| `drizzle-kit generate --name <name>` | Create migration files | ✅ Yes |
| `drizzle-kit migrate` | Apply pending migrations | ✅ Yes |
| `drizzle-kit push` | Sync schema directly to DB | ❌ **NEVER** - human only |
| `drizzle-kit pull` / `introspect` | Generate schema from existing DB | ✅ Yes |
| `drizzle-kit studio` | Visual DB browser | ✅ Yes |

## When Push Is Needed (Human-Only)

If `push` is the only solution (e.g., fixing migration drift in local dev), instruct the user:

```
═══════════════════════════════════════════════════════════════
⚠️  MANUAL ACTION REQUIRED - drizzle-kit push
═══════════════════════════════════════════════════════════════

I cannot run `drizzle-kit push` because it has interactive
prompts that will hang. Please run this in a separate terminal:

    pnpm drizzle-kit push

When prompted:
- "Create or rename?" → Choose based on your intent:
  - "Create" = Table is genuinely new
  - "Rename" = You renamed an existing table
- Review any destructive changes before confirming

Let me know when complete and I'll continue.
═══════════════════════════════════════════════════════════════
```

## AI Workflow: Always Generate + Migrate

```
Schema change needed?
├── drizzle-kit generate --name <descriptive_name>
├── Review the generated SQL
└── drizzle-kit migrate
```

**This is the ONLY workflow AI should use.** Never suggest `push` as a shortcut.

## Standard Workflow

```bash
# 1. Edit schema.ts - add/modify table definitions

# 2. Generate migration with descriptive name
pnpm drizzle-kit generate --name add_users_table

# 3. ALWAYS review generated SQL before applying
cat drizzle/XXXX_add_users_table.sql

# 4. Apply to local DB
pnpm drizzle-kit migrate

# 5. Verify with studio
pnpm drizzle-kit studio

# 6. Commit schema AND migration together
git add app/lib/db/schema.ts drizzle/
git commit -m "feat: add users table"
```

## Migration History Out of Sync

**Symptoms:** Drizzle asks "create or rename?" for tables that already exist

**Cause:** Tables exist in DB but weren't created through migrations

**Fix Option 1 - Quick reset (requires human):**

Instruct the user to run `push` manually:

```
⚠️ MANUAL ACTION REQUIRED

Run in a separate terminal:
    pnpm drizzle-kit push

When prompted "Create or rename?":
- Choose "Create" for tables that exist but weren't tracked
- This syncs Drizzle's state with the actual DB

Let me know when complete.
```

**Fix Option 2 - Proper baseline (AI can do this):**

```bash
# Backup and reset migration tracking
mv drizzle drizzle-backup
mkdir -p drizzle/meta

# Introspect current DB state
pnpm drizzle-kit pull

# Generate a baseline migration (no changes, just establishes tracking)
pnpm drizzle-kit generate --name baseline

# Apply to mark as complete
pnpm drizzle-kit migrate
```

## Environment Sync

### Local → Staging

```bash
# Generate migration locally first
pnpm drizzle-kit generate --name your_changes

# Apply to staging
DATABASE_URL=$STAGING_URL pnpm drizzle-kit migrate
```

### Staging → Production

```bash
# NEVER push to production - always migrate
DATABASE_URL=$PROD_URL pnpm drizzle-kit migrate
```

### Pull Remote Schema

```bash
# Introspect remote DB into local schema
DATABASE_URL=$REMOTE_URL pnpm drizzle-kit pull
```

---

## PostgreSQL Best Practices (Drizzle)

### Primary Keys

```typescript
// Preferred: UUID for distributed systems / external exposure
id: uuid('id').primaryKey().defaultRandom(),

// Alternative: BIGINT for internal tables with high volume
id: bigserial('id', { mode: 'bigint' }).primaryKey(),
```

### Timestamps - Always Use TIMESTAMPTZ

```typescript
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
```

### Foreign Keys - MUST Add Index Manually

PostgreSQL does NOT auto-index foreign key columns. Always add indexes:

```typescript
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
  },
  (table) => [
    index('idx_posts_author_id').on(table.authorId),  // REQUIRED!
  ],
);
```

### Constraints

```typescript
// NOT NULL everywhere semantically required
email: text('email').notNull().unique(),

// Defaults for common values
status: text('status').notNull().default('pending'),
isActive: boolean('is_active').notNull().default(true),
```

### Money - Use NUMERIC, Not Float

```typescript
import { numeric } from 'drizzle-orm/pg-core';

price: numeric('price', { precision: 10, scale: 2 }).notNull(),
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Table names | snake_case, plural | `user_profiles` |
| Column names | snake_case | `created_at` |
| Index names | `idx_<table>_<column>` | `idx_posts_author_id` |
| FK columns | `<referenced_table>_id` | `author_id` |
| Migration names | kebab-case descriptive | `add-user-profiles-table` |

---

## Config File (drizzle.config.ts)

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './app/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Troubleshooting

### "Table already exists" during migrate

```bash
# Check what Drizzle thinks is applied
psql $DATABASE_URL -c "SELECT * FROM drizzle.__drizzle_migrations;"

# Manually mark migration as applied (if table exists)
psql $DATABASE_URL -c "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('<hash>', NOW());"
```

### Interactive prompts during generate

Drizzle asks "create or rename?" when schema doesn't match DB state.

- **Create** - Table is genuinely new
- **Rename** - You renamed a table in schema.ts

**If confused about the state:** Use `drizzle-kit pull` to introspect the current DB and compare with your schema. If sync is needed, instruct the user to run `push` manually (AI cannot run push due to interactive prompts).

### Rollback a Migration

Drizzle doesn't have automatic rollback. Options:

1. **Create reverse migration** - Generate new migration that undoes changes
2. **Restore from backup** - If you have DB snapshots
3. **Manual SQL** - Write DROP/ALTER statements carefully

---

## Safety Rules

1. **AI must NEVER run `push`** - Interactive prompts will hang; instruct human to run manually
2. **Never `push` to production** - Always use `migrate` with reviewed SQL
3. **Always review generated SQL** - Check for unintended DROP statements
4. **Commit schema + migration together** - Keep them in sync
5. **Test on staging first** - Before production deployment
6. **Index your foreign keys** - PostgreSQL doesn't do this automatically
7. **Backup before destructive changes** - Dropping tables/columns loses data

---

## References

- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [PostgreSQL Table Design Skill](https://github.com/wshobson/agents/blob/main/plugins/database-design/skills/postgresql/SKILL.md)
- [Drizzle Migration Skill](https://claude-plugins.dev/skills/@Dexploarer/hyper-forge/drizzle-migration)
