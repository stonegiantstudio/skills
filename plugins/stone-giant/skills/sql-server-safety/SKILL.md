---
description: >
  SQL Server safety patterns that prevent production incidents: division
  guards, error handling, silent failures, injection, transaction safety.
  Use when editing .sql files with T-SQL syntax or TypeScript files with
  raw SQL queries ($executeRaw, $queryRaw, EXEC, BEGIN TRAN).
---

# SQL Server Safety

You are a SQL Server safety specialist. Your job is to catch T-SQL patterns
that cause production incidents: silent data corruption, unhandled errors,
security vulnerabilities, and nondeterministic behavior.

This skill is specific to SQL Server (T-SQL). For PostgreSQL patterns,
see the `postgresql` skill. For Prisma ORM patterns, see `prisma-safety`.

## Core Rules

These 10 rules are derived from real production incidents. Each one caused
data loss, downtime, or security exposure in a multi-tenant SaaS application.

### Rule 1: Division Without NULLIF Guard

Every division operator must guard against divide-by-zero. SQL Server
throws error 8134, crashing the query and any transaction it's in.

```sql
-- WRONG: Crashes when @TargetPercent is 0
SET @Variance = @Actual / @TargetPercent * 100;

-- CORRECT: Returns NULL instead of crashing
SET @Variance = @Actual / NULLIF(@TargetPercent, 0) * 100;
```

Flag every `/` in a SQL expression that does not use `NULLIF(divisor, 0)`
or an explicit `IF @divisor != 0` guard.

**When NOT to flag:** Division by a literal constant (e.g., `/ 100`,
`/ 12`), or cases where the divisor is constrained NOT NULL with a CHECK
constraint that excludes 0.

### Rule 2: Use ;THROW, Not RAISERROR

`RAISERROR` is deprecated and does **not** honor `SET XACT_ABORT ON` —
meaning errors raised with `RAISERROR` inside a transaction will not
trigger an automatic rollback, even with `XACT_ABORT` enabled.

```sql
-- WRONG: Does not trigger XACT_ABORT rollback
RAISERROR('Record not found', 16, 1);

-- CORRECT: Honors XACT_ABORT, consistent error handling
;THROW 50001, 'Record not found', 1;
```

The leading semicolon in `;THROW` is intentional — it prevents parse
errors when the previous statement is not semicolon-terminated.

**When NOT to flag:** `RAISERROR` with `WITH LOG` (required for logging
to the SQL Server error log — `;THROW` cannot do this). Also acceptable
in legacy procs being maintained but not rewritten.

### Rule 3: Check @@ROWCOUNT After UPDATE/DELETE

`UPDATE ... WHERE` and `DELETE ... WHERE` that affect 0 rows return
success. The operation "worked" — it just didn't change anything. Without
a row-count check, the UI shows success while no data changed.

```sql
-- WRONG: Silent success when no rows match
UPDATE dbo.Projects SET Status = 'Active'
WHERE TenantId = @TenantId AND ProjectId = @ProjectId;

-- CORRECT: Check affected rows
UPDATE dbo.Projects SET Status = 'Active'
WHERE TenantId = @TenantId AND ProjectId = @ProjectId;

IF @@ROWCOUNT = 0
BEGIN
    ;THROW 50002, 'Project not found or no rows affected', 1;
END
```

**When NOT to flag:** Bulk UPDATE/DELETE operations where 0 rows is a
valid outcome (e.g., cleanup jobs, backfill scripts). Also skip when the
row count is used for logging only, not error detection.

### Rule 4: CREATE INDEX Must Be Idempotent

Migrations must be safe to run more than once. `CREATE INDEX` without a
guard fails if the index already exists.

```sql
-- WRONG: Fails on re-run
CREATE NONCLUSTERED INDEX IX_Projects_Status
ON dbo.Projects(Status);

-- CORRECT: Idempotent
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Projects_Status'
    AND object_id = OBJECT_ID('dbo.Projects')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Projects_Status
    ON dbo.Projects(Status);
END
```

**When NOT to flag:** `CREATE OR ALTER` statements (inherently idempotent).
R__ (repeatable) migration files where Flyway handles re-execution.

### Rule 5: SET XACT_ABORT ON in Every Data-Modifying Proc

Without `SET XACT_ABORT ON`, errors inside a transaction do **not**
automatically roll back. Execution continues with partial changes
committed. The default is OFF.

```sql
-- WRONG: Missing XACT_ABORT — partial commits on error
CREATE OR ALTER PROCEDURE dbo.usp_UpdateProject
    @TenantId INT,
    @ProjectId INT,
    @Status NVARCHAR(50)
AS
BEGIN
    BEGIN TRANSACTION;
    -- If this fails, execution continues and COMMIT runs
    UPDATE dbo.Projects SET Status = @Status
    WHERE TenantId = @TenantId AND ProjectId = @ProjectId;
    COMMIT TRANSACTION;
END

-- CORRECT: XACT_ABORT ensures automatic rollback on any error
CREATE OR ALTER PROCEDURE dbo.usp_UpdateProject
    @TenantId INT,
    @ProjectId INT,
    @Status NVARCHAR(50)
AS
BEGIN
    SET XACT_ABORT ON;
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    UPDATE dbo.Projects SET Status = @Status
    WHERE TenantId = @TenantId AND ProjectId = @ProjectId;
    COMMIT TRANSACTION;
END
```

Every stored procedure that modifies data should start with
`SET XACT_ABORT ON; SET NOCOUNT ON;`.

### Rule 6: Use sp_executesql, Not EXEC(@sql)

`EXEC(@sql)` with string concatenation is a SQL injection vector.
Parameters are not sanitized — they are concatenated directly into the
SQL string.

```sql
-- WRONG: SQL injection via @SearchTerm
DECLARE @sql NVARCHAR(MAX) = N'SELECT * FROM Projects WHERE Name = '''
    + @SearchTerm + '''';
EXEC(@sql);

-- CORRECT: Parameterized dynamic SQL
DECLARE @sql NVARCHAR(MAX) = N'SELECT * FROM Projects WHERE Name = @Name';
EXEC sp_executesql @sql, N'@Name NVARCHAR(100)', @Name = @SearchTerm;
```

### Rule 7: Use SCOPE_IDENTITY() or OUTPUT, Not @@IDENTITY

`@@IDENTITY` returns the last identity value generated on the connection,
including values generated by triggers on other tables. This returns
wrong values when triggers exist.

```sql
-- WRONG: Returns identity from trigger's table, not yours
INSERT INTO dbo.Projects (TenantId, Name)
VALUES (@TenantId, @Name);
SET @NewId = @@IDENTITY;

-- CORRECT: Returns identity from this scope only
INSERT INTO dbo.Projects (TenantId, Name)
VALUES (@TenantId, @Name);
SET @NewId = SCOPE_IDENTITY();

-- BEST: OUTPUT clause, works with multi-row inserts
INSERT INTO dbo.Projects (TenantId, Name)
OUTPUT inserted.ProjectId
VALUES (@TenantId, @Name);
```

### Rule 8: No NOLOCK / READ UNCOMMITTED

`WITH (NOLOCK)` reads uncommitted data. This means:
- Reading rows that will be rolled back (phantom data)
- Reading partial updates (torn reads)
- Skipping rows entirely due to page splits
- In a multi-tenant app: exposing Tenant A's uncommitted data to Tenant B

```sql
-- WRONG: Dirty reads, phantom data, skipped rows
SELECT * FROM dbo.Projects WITH (NOLOCK)
WHERE TenantId = @TenantId;

-- CORRECT: Use appropriate isolation level if needed
-- Default READ COMMITTED is fine for most queries
SELECT * FROM dbo.Projects
WHERE TenantId = @TenantId;

-- If you need snapshot reads without blocking:
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
SELECT * FROM dbo.Projects
WHERE TenantId = @TenantId;
```

If a query is "too slow" without NOLOCK, fix the query or add indexes —
don't paper over it with dirty reads.

### Rule 9: No Orphaned Transactions

Every `BEGIN TRANSACTION` must have a `COMMIT` or `ROLLBACK` in all code
paths, including error paths. An uncommitted transaction holds locks
indefinitely, blocking other sessions and growing the transaction log.

```sql
-- WRONG: Error before COMMIT leaves transaction open
BEGIN TRANSACTION;
UPDATE dbo.Projects SET Status = 'Active'
WHERE TenantId = @TenantId AND ProjectId = @ProjectId;
-- If the next statement errors, transaction stays open forever
UPDATE dbo.AuditLog SET Action = 'StatusChange'
WHERE TenantId = @TenantId AND ProjectId = @ProjectId;
COMMIT TRANSACTION;

-- CORRECT: XACT_ABORT + TRY/CATCH ensures cleanup
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE dbo.Projects SET Status = 'Active'
    WHERE TenantId = @TenantId AND ProjectId = @ProjectId;
    UPDATE dbo.AuditLog SET Action = 'StatusChange'
    WHERE TenantId = @TenantId AND ProjectId = @ProjectId;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    ;THROW;
END CATCH
```

### Rule 10: SET NOCOUNT ON

Without `SET NOCOUNT ON`, SQL Server sends row-count messages
(`N rows affected`) after every statement. These extra result sets
confuse Prisma and other ORMs that expect a specific number of result
sets from a stored procedure call.

```sql
-- WRONG: Extra result-set metadata confuses ORM
CREATE OR ALTER PROCEDURE dbo.usp_GetProjects
    @TenantId INT
AS
BEGIN
    SELECT * FROM dbo.Projects WHERE TenantId = @TenantId;
END

-- CORRECT: Suppress row-count messages
CREATE OR ALTER PROCEDURE dbo.usp_GetProjects
    @TenantId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.Projects WHERE TenantId = @TenantId;
END
```

Every stored procedure should include `SET NOCOUNT ON` as its first
statement.

## Additional Patterns

These patterns appear across multiple static analysis tools (TSQLLint,
Redgate SQL Prompt, SQLFluff, SonarSource, ErikEJ) and cause subtle bugs
under production conditions. They are lower-severity than the core rules
but worth flagging when spotted.

| Pattern | Problem | Fix |
|---------|---------|-----|
| `NOT IN` with nullable column | If subquery returns any NULL, entire `NOT IN` returns empty set silently | Use `NOT EXISTS` instead |
| `TOP` without `ORDER BY` | Nondeterministic — returns different rows depending on execution plan, indexes, parallelism | Always pair `TOP` with `ORDER BY` |
| Implicit type conversion | VARCHAR param vs NVARCHAR column (or vice versa) causes per-row conversion, killing index seeks | Match parameter types to column types exactly |
| `ISNULL` silent truncation | `ISNULL(varchar(3)_col, 'longer fallback')` truncates to 3 characters with no error | Use `COALESCE` (uses widest type) or explicit `CAST` |
| `MERGE` without `HOLDLOCK` | Race condition under concurrent load — duplicate key violations from simultaneous upserts | Add `WITH (HOLDLOCK)` to the target table hint |
| Missing semicolon before `;THROW`/`WITH`/`MERGE` | Cryptic parse errors or silent misbehavior when previous statement is not terminated | Always terminate statements with semicolons |

## Code Review Checklist

When reviewing `.sql` files or TypeScript with raw SQL:

- [ ] Every division uses `NULLIF(divisor, 0)` or explicit zero guard
- [ ] Error handling uses `;THROW`, not `RAISERROR`
- [ ] UPDATE/DELETE checks `@@ROWCOUNT` when 0 rows is an error condition
- [ ] CREATE INDEX is wrapped in `IF NOT EXISTS`
- [ ] Data-modifying procs start with `SET XACT_ABORT ON; SET NOCOUNT ON;`
- [ ] Dynamic SQL uses `sp_executesql` with parameters, not `EXEC(@sql)`
- [ ] Identity retrieval uses `SCOPE_IDENTITY()` or `OUTPUT`, not `@@IDENTITY`
- [ ] No `WITH (NOLOCK)` or `READ UNCOMMITTED` hints
- [ ] Every `BEGIN TRANSACTION` has `COMMIT`/`ROLLBACK` in all paths
- [ ] No `NOT IN` on nullable columns

## Related Skills

- **multi-tenant-safety** — tenant-scoped queries, hardcoded ID detection
- **prisma-safety** — ORM-level patterns ($transaction, $executeRaw,
  BigInt handling)
