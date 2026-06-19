---
name: sql-server-performance
description: >
  SQL Server query performance optimization: SARGability, index strategy (ESR rule),
  parameter sniffing, execution plans, TVF/view patterns, concurrency, TempDB,
  compression, and diagnostic DMVs. Use when writing or reviewing T-SQL queries,
  stored procedures, table-valued functions, or views for performance.
metadata:
  triggers:
    patterns:
      - "*.sql"
    keywords:
      - "slow query"
      - "query performance"
      - "execution plan"
      - "parameter sniffing"
      - "index"
      - "sargable"
      - "tempdb spill"
      - "deadlock"
      - "blocking"
      - "table-valued function"
      - "tvf"
      - "indexed view"
      - "query tuning"
      - "query optimization"
---

# SQL Server Query Performance

You are a SQL Server performance specialist. Your job is to write the fastest
possible queries, stored procedures, table-valued functions, and views. Every
pattern in this skill is derived from expert practitioners: Brent Ozar, Erik
Darling, Paul White, Kendra Little, Itzik Ben-Gan, Aaron Bertrand, and
Microsoft documentation.

This skill covers **performance**. For schema design, see `sql-server`. For
safety patterns, see `sql-server-safety`. For multi-tenant isolation, see
`multi-tenant-safety`.

---

## Quick Wins: The 5 Highest-Leverage Patterns

1. **Make predicates SARGable** -- rewrite `WHERE YEAR(col) = 2024` to range
   predicates. Eliminates full scans instantly. (Section 1)
2. **Add INCLUDE columns to eliminate Key Lookups** -- the single most common
   plan fix. Turns random I/O into a pure index seek. (Section 2)
3. **Use NOT EXISTS, never NOT IN** -- NOT IN silently returns zero rows when
   NULLs exist. NOT EXISTS is safe and usually faster. (Section 3)
4. **Inline TVFs, never multi-statement TVFs** -- MSTVFs get a fixed 100-row
   estimate regardless of actual data. Inline TVFs are fully optimized. (Section 5)
5. **Enable RCSI** -- eliminates 60-90% of deadlocks and all reader-writer
   blocking with a single ALTER DATABASE. (Section 10)

**Validate every optimization.** Use the benchmarking protocol in Section 0
to prove your change is faster with logical reads, not assumptions.

---

## 0. How to Benchmark: Prove It's Faster

Every optimization in this skill should be validated, not assumed. When
comparing two query approaches, follow this protocol.

### Step 1: Capture baseline (Approach A)

```sql
-- Clear buffer pool so both approaches start cold (dev/test ONLY, never prod)
CHECKPOINT;
DBCC DROPCLEANBUFFERS;

-- Clear the plan cache for a SPECIFIC query (safe, targeted)
-- Find the plan handle first:
SELECT plan_handle FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
WHERE st.text LIKE '%YourQuerySignature%';
-- Then evict just that plan:
DBCC FREEPROCCACHE(0x06000700...);  -- specific plan handle

-- Turn on diagnostics
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Run Approach A
-- Copy the Messages tab output: logical reads, CPU time, elapsed time
```

### Step 2: Capture alternative (Approach B)

```sql
-- Clear again for a fair cold-cache comparison
CHECKPOINT;
DBCC DROPCLEANBUFFERS;

-- Run Approach B
-- Copy the Messages tab output
```

### Step 3: Compare the right metric

| Metric | What it tells you | Stability |
|---|---|---|
| **Logical reads** | Pages read from buffer pool. THE primary metric. | Highly stable -- same value every run regardless of server load |
| **CPU time** | Processor time consumed. Good secondary metric. | Stable -- varies <10% across runs |
| **Elapsed time** | Wall clock time. Includes waits, blocking, network. | Noisy -- varies with server load, parallelism, other sessions |

**Logical reads is the metric that matters.** A query dropping from 12,000
to 200 logical reads is definitively faster. Elapsed time can mislead --
a query may run faster on a warm cache, under less load, or with a
different parallel plan.

### Step 4: Warm cache comparison (run each 3-5 times)

```sql
-- After the cold-cache test, run each approach 3-5 times WITHOUT clearing
-- buffers. This simulates steady-state production behavior where data
-- pages are already in memory.

-- Record logical reads (should be identical each run) and elapsed time
-- (take the median, not the average -- discard the first and last).
```

### Step 5: Compare execution plans

```sql
-- Get the actual execution plan for both approaches
SET STATISTICS XML ON;
-- Run Approach A
SET STATISTICS XML OFF;

SET STATISTICS XML ON;
-- Run Approach B
SET STATISTICS XML OFF;
```

Compare: estimated vs actual rows (cardinality accuracy), operator choices
(seeks vs scans, nested loops vs hash joins), warnings (spills, implicit
conversions), and total subtree cost.

### When to use Query Store instead

For production queries you cannot run interactively, Query Store compares
plan performance over time:

```sql
-- Compare two plans for the same query
SELECT p.plan_id, p.query_plan_hash,
    rs.avg_duration, rs.avg_logical_io_reads,
    rs.avg_cpu_time, rs.count_executions,
    rs.first_execution_time, rs.last_execution_time
FROM sys.query_store_plan p
JOIN sys.query_store_runtime_stats rs ON p.plan_id = rs.plan_id
WHERE p.query_id = @query_id
ORDER BY rs.last_execution_time DESC;
```

### Protocol summary

1. **Cold cache** -- DROPCLEANBUFFERS, run each once, compare logical reads
2. **Warm cache** -- run each 3-5 times, compare median elapsed time
3. **Plans** -- compare actual execution plans for operator differences
4. **Declare a winner** based on logical reads first, CPU second, elapsed third
5. **Document the delta** -- "Approach B: 200 reads vs 12,000 reads (60x)"

**Never skip benchmarking.** "Should be faster" is not the same as "is
faster." Parameter sniffing, data skew, and cardinality estimation can
make theoretically better approaches perform worse in practice.

---

## 1. SARGability: The Foundation

A predicate is **SARGable** (Search ARGument able) when SQL Server can use an
index seek. The column must appear unmodified on one side of the comparison.

### SARGable operators

`=`, `>`, `>=`, `<`, `<=`, `BETWEEN`, `IN`, `LIKE 'prefix%'`

### Non-SARGable operators

`<>`, `NOT IN`, `NOT LIKE`, `LIKE '%suffix'`, `LIKE '%middle%'`

### Anti-patterns and rewrites

**Functions on columns:**

```sql
-- NON-SARGABLE
WHERE YEAR(OrderDate) = 2024
WHERE CONVERT(DATE, CreatedAt) = '2024-01-15'
WHERE ISNULL(MiddleName, '') = ''

-- SARGABLE
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01'
WHERE CreatedAt >= '2024-01-15' AND CreatedAt < '2024-01-16'
WHERE MiddleName IS NULL OR MiddleName = ''
```

**Math on columns:**

```sql
-- NON-SARGABLE
WHERE Price * 1.1 > 100

-- SARGABLE: move math to the other side
WHERE Price > 100 / 1.1
```

**Implicit type conversions (the #1 hidden performance killer):**

When comparing a `VARCHAR` column to an `NVARCHAR` parameter, SQL Server
converts EVERY row's column value to NVARCHAR, killing index seeks. .NET,
Entity Framework, and Prisma send string params as NVARCHAR by default.

```sql
-- KILLS INDEX SEEK: column-side conversion on every row
WHERE VarcharColumn = N'SomeValue'

-- PRESERVES SEEK: match the column type
WHERE VarcharColumn = 'SomeValue'
```

**Data type precedence rule:** The lower-precedence type is converted to the
higher. NVARCHAR > VARCHAR, so the VARCHAR *column* gets converted (millions
of conversions), not the parameter.

**LIKE with leading wildcard — workaround:**

```sql
-- NON-SARGABLE
WHERE Email LIKE '%@gmail.com'

-- Workaround: reversed computed column + index
ALTER TABLE Users ADD EmailReversed AS REVERSE(Email);
CREATE INDEX IX_Users_EmailReversed ON Users(EmailReversed);
-- Then:
WHERE EmailReversed LIKE REVERSE('@gmail.com') + '%'
```

**ISNULL vs COALESCE SARGability:**

`ISNULL` can preserve SARGability in some cases because the optimizer knows
it returns the column's data type. `COALESCE` wraps in CASE, which may
prevent seeks. However, neither should be in a WHERE clause if avoidable --
rewrite to explicit `IS NULL OR col = ...` for guaranteed SARGability.

**Computed column escape hatch** (for ORM-generated queries you cannot
rewrite):

```sql
ALTER TABLE Orders ADD OrderYear AS YEAR(OrderDate) PERSISTED;
CREATE INDEX IX_Orders_OrderYear ON Orders(OrderYear);
-- Now WHERE OrderYear = 2024 is SARGable
```

---

## 2. Index Strategy

### Clustered index: the NUSE rule

The clustered key should be **Narrow, Unique, Static, Ever-increasing**:

- **Narrow:** The key is stored in every nonclustered index. INT (4 bytes) or
  BIGINT (8 bytes) is ideal. NVARCHAR(256) bloats everything.
- **Unique:** Without explicit uniqueness, SQL Server adds a hidden 4-byte
  uniquifier silently.
- **Static:** Changing a clustered key value forces delete + re-insert across
  every nonclustered index.
- **Ever-increasing:** IDENTITY, SEQUENCE, or NEWSEQUENTIALID(). Random GUIDs
  (NEWID()) cause massive page splits and fragmentation.

**The canonical choice: INT/BIGINT IDENTITY.**

### Composite index column ordering: the ESR rule

Order columns as **Equality, Sort, Range** (Erik Darling):

1. **Equality** columns first (`WHERE col = @value`) -- enable index seek
2. **Sort** columns second (`ORDER BY col`) -- eliminate Sort operator
3. **Range** columns third (`WHERE col > @value`, `BETWEEN`, `LIKE`) -- once
   a range is hit, the index cannot seek further right
4. **Cover** columns in INCLUDE -- only in leaf pages, not in B-tree

```sql
-- Query:
SELECT OrderId, Amount FROM Orders
WHERE CustomerId = @CustId AND OrderDate >= @StartDate
ORDER BY OrderDate;

-- Optimal index (ESR):
CREATE NONCLUSTERED INDEX IX_Orders_Cust_Date
ON Orders (CustomerId, OrderDate)  -- equality, then sort+range
INCLUDE (Amount);                  -- cover
```

### Covering indexes eliminate Key Lookups

A Key Lookup means the nonclustered index found rows but must fetch
additional columns from the clustered index. Each lookup is a random I/O.
Fix: add missing columns to INCLUDE.

```sql
-- Before: seek + Key Lookup per row
CREATE INDEX IX_Posts_UserId ON Posts(UserId);

-- After: seek only, no lookup
CREATE INDEX IX_Posts_UserId ON Posts(UserId) INCLUDE (Title, Status, CreatedAt);
```

### Filtered indexes

Dramatically smaller and faster for common subsets:

```sql
CREATE INDEX IX_Orders_Pending ON Orders(CreatedAt) WHERE Status = 'Pending';
CREATE INDEX IX_Users_Active ON Users(Email) WHERE IsActive = 1;
```

### Index anti-patterns

| Anti-pattern | Problem |
|---|---|
| Over-indexing (15+ NCIs) | Every INSERT/UPDATE/DELETE maintains all indexes |
| Duplicate/redundant indexes | Index on (A) is redundant when (A, B) exists |
| Unused indexes (0 seeks, 0 scans) | Pure write overhead, wastes buffer pool |
| NEWID() as clustered key | Random page splits, massive fragmentation |
| Blindly creating missing index suggestions | Per-query, ignores write cost and overlap |

### Never blindly create missing index suggestions

The DMV suggestions are per-query, capped at 600 entries, don't consider
existing indexes, write overhead, or overlap. Always consolidate and apply
the ESR rule yourself.

---

## 3. Query Patterns: Fastest Implementations

### Semi-joins: EXISTS vs IN vs JOIN

All three typically produce the same plan in modern SQL Server. Prefer
`EXISTS` -- clearest intent, handles NULLs safely, short-circuits.

### Anti-joins: NOT EXISTS is safest and fastest

```sql
-- BEST: safe with NULLs, clear intent
SELECT o.* FROM Orders o
WHERE NOT EXISTS (SELECT 1 FROM Returns r WHERE r.OrderId = o.OrderId);

-- DANGEROUS: if Returns.OrderId contains ANY NULL, returns ZERO rows
SELECT o.* FROM Orders o
WHERE o.OrderId NOT IN (SELECT OrderId FROM Returns);
```

The `NOT IN` NULL trap: `value NOT IN (1, 2, NULL)` evaluates to UNKNOWN
for every value. UNKNOWN in WHERE filters out the row. Result: zero rows.

### Pagination: keyset beats OFFSET/FETCH

```sql
-- OFFSET/FETCH: O(n) -- scans and discards skipped rows. Gets SLOWER per page.
SELECT Id, Title, CreatedAt FROM Posts
ORDER BY CreatedAt DESC
OFFSET 10000 ROWS FETCH NEXT 25 ROWS ONLY;

-- KEYSET/SEEK: O(1) -- constant time regardless of page depth
SELECT TOP 25 Id, Title, CreatedAt FROM Posts
WHERE (CreatedAt < @LastCreatedAt)
   OR (CreatedAt = @LastCreatedAt AND Id < @LastId)
ORDER BY CreatedAt DESC;

-- Required index for the keyset pattern:
CREATE INDEX IX_Posts_CreatedAt_Id ON Posts(CreatedAt DESC, Id DESC)
INCLUDE (Title);
```

Keyset is ~100x faster for deep pages. Requires passing last-seen key
values from the previous page; does not support "jump to page N" directly.
For single-column unique sort keys, the tiebreaker is unnecessary.

### Running totals: ROWS not RANGE

```sql
-- CORRECT: in-memory spool, fast
SUM(Amount) OVER (ORDER BY OrderDate ROWS UNBOUNDED PRECEDING)

-- WRONG: RANGE is the default, uses expensive on-disk spool
SUM(Amount) OVER (ORDER BY OrderDate)
```

Always specify `ROWS`, not `RANGE` (the implicit default).

### String aggregation

```sql
-- BEST (2017+): ~5-10x faster than FOR XML PATH
SELECT DepartmentId,
    STRING_AGG(Name, ', ') WITHIN GROUP (ORDER BY Name)
FROM Employees GROUP BY DepartmentId;
```

### Conditional aggregation vs multiple queries

```sql
-- ONE scan instead of N separate queries
SELECT
    COUNT(CASE WHEN Status = 'Active' THEN 1 END)   AS ActiveCount,
    COUNT(CASE WHEN Status = 'Closed' THEN 1 END)   AS ClosedCount,
    SUM(CASE WHEN Status = 'Active' THEN Amount END) AS ActiveAmount
FROM Orders WHERE OrderDate >= @StartDate;
```

### UNION ALL over UNION

`UNION` performs a DISTINCT sort; `UNION ALL` does not. Always use `UNION
ALL` when duplicates are acceptable or impossible.

### CROSS APPLY for "top N per group"

```sql
SELECT c.CustomerId, c.Name, o.OrderDate, o.Amount
FROM Customers c
CROSS APPLY (
    SELECT TOP 3 OrderDate, Amount FROM Orders o
    WHERE o.CustomerId = c.CustomerId
    ORDER BY OrderDate DESC
) o;
```

### CTEs are not materialized -- materialize shared CTEs yourself

SQL Server expands CTEs inline at every reference point. A CTE is syntactic
sugar, not a plan boundary. When a CTE feeds into a UNION ALL with N
branches, the optimizer expands the entire CTE chain N times independently.

```sql
-- BAD: EmployeeSummary CTE reads vwTimeEntries.
-- 6 UNION ALL branches each re-expand it = 6 independent copies of a
-- 7-table join tree. Optimizer hits TimeOut, picks a naive plan.
;WITH EmployeeSummary AS (SELECT ... FROM dbo.vwTimeEntries ...)
SELECT ... FROM EmployeeSummary WHERE EarningType = 'REG'
UNION ALL
SELECT ... FROM EmployeeSummary WHERE EarningType = 'OT'
UNION ALL
SELECT ... FROM EmployeeSummary WHERE EarningType = 'PTO'
-- ...3 more branches, each re-reading the entire view

-- GOOD: Materialize the expensive computation ONCE into a temp table.
-- CTEs over the temp table are cheap -- each branch reads a small
-- physical table with statistics, not a re-expanded join tree.
SELECT e.EmployeeId, te.HoursWorked, ph.PhaseName
INTO #TE
FROM @Emps ee
JOIN dbo.TimeEntryWeeks tew ON tew.EmployeeId = ee.EmployeeId
JOIN dbo.TimeEntries te ON te.TimeEntryWeekId = tew.TimeEntryWeekId
JOIN dbo.Phases ph ON tew.PhaseId = ph.PhaseId
WHERE te.DateWorked BETWEEN @startDate AND @endDate;

;WITH EmployeeSummary AS (SELECT ... FROM #TE ...)  -- reads ~200 rows
SELECT ... FROM EmployeeSummary ...
UNION ALL ...  -- each branch reads the small temp table, not 7-table views
```

**Rule:** If a CTE will be referenced more than once (multiple UNION ALL
branches, multiple downstream CTEs, or a self-join), materialize it into a
temp table first. The temp table's value is as a **plan boundary** -- it
gives the optimizer statistics and prevents CTE expansion. The cost of
writing to TempDB is negligible compared to re-executing the source N times.

### CROSS APPLY VALUES to avoid UNION ALL branches

When generating multiple derived rows per source row (e.g., unpivoting
fixed earning types), use CROSS APPLY VALUES instead of UNION ALL. Each
UNION ALL branch is an independent query that expands its own CTE
references. VALUES generates multiple rows in a single pass.

```sql
-- BAD: 3 UNION ALL branches, each re-expands the CTE
SELECT EmployeeId, 'REG' AS Type, RegularHours AS Hours FROM Summary
UNION ALL
SELECT EmployeeId, 'OT',  OvertimeHours FROM Summary
UNION ALL
SELECT EmployeeId, 'PTO', PTOHours FROM Summary

-- GOOD: single pass, no CTE re-expansion
SELECT s.EmployeeId, v.EarningType, v.Hours
FROM Summary s
CROSS APPLY (VALUES
    ('REG', s.RegularHours),
    ('OT',  s.OvertimeHours),
    ('PTO', s.PTOHours)
) v(EarningType, Hours)
WHERE v.Hours > 0;  -- bonus: can filter inline
```

### The correct upsert pattern (avoid MERGE)

MERGE has documented bugs with indexed views, filtered indexes, temporal
tables, and OUTPUT clause. Race conditions without SERIALIZABLE/HOLDLOCK.

```sql
SET XACT_ABORT ON;
BEGIN TRANSACTION;

UPDATE dbo.Settings WITH (UPDLOCK, SERIALIZABLE)
SET Value = @Value
WHERE TenantId = @TenantId AND [Key] = @Key;

IF @@ROWCOUNT = 0
BEGIN
    INSERT INTO dbo.Settings (TenantId, [Key], Value)
    VALUES (@TenantId, @Key, @Value);
END

COMMIT TRANSACTION;
```

UPDLOCK prevents conversion deadlocks. SERIALIZABLE prevents phantom inserts.

---

## 4. Stored Procedures

### Temp tables vs table variables

| Characteristic | #Temp Tables | @Table Variables |
|---|---|---|
| Statistics | Yes (auto-created) | No (pre-2019) |
| Cardinality estimate | Based on statistics | Fixed 1 row (pre-2019) |
| Parallel plans | Yes | No (modifications block parallelism) |
| Indexes | Any type | Primary key / unique only |

**Rule:** Use #temp tables when >~100 rows or complex joins. Use table
variables for small, fixed-size sets or when rows must survive ROLLBACK.

**SQL Server 2019+ (compat 150):** Table Variable Deferred Compilation uses
actual row counts instead of the fixed 1-row estimate. No code change needed.

### Small driving set pattern (table variable with PRIMARY KEY)

When a proc identifies a small set of entities (employees, orders, tenants)
and then joins them to large tables, use a table variable with a PRIMARY KEY
as the **driving table**. The PK gives the optimizer cardinality information
and a unique clustered index, which consistently produces nested loop seeks
instead of hash joins on large scans.

```sql
-- Step 1: Small driving set with PRIMARY KEY
DECLARE @Emps TABLE (EmployeeId INT PRIMARY KEY);
INSERT INTO @Emps
SELECT et.EmployeeId FROM dbo.EmployeeTenure et
WHERE et.TenantId = @tenantId AND et.EmploymentType = 'Exempt';
-- ~62 rows

-- Step 2: Drive joins FROM the small set
SELECT tew.EmployeeId, te.HoursWorked, ph.PhaseName
INTO #TE
FROM @Emps ee                              -- 62 rows, driving table
JOIN dbo.TimeEntryWeeks tew
  ON tew.EmployeeId = ee.EmployeeId        -- index seek per employee
JOIN dbo.TimeEntries te
  ON te.TimeEntryWeekId = tew.TimeEntryWeekId  -- index seek per week
JOIN dbo.Phases ph
  ON tew.PhaseId = ph.PhaseId;             -- index seek per phase
```

Without the driving set, the optimizer may choose a date-driven scan
(4,500 rows across all employees) and hash join to filter down. With the
driving set, it does 62 index seeks -- dramatically fewer reads.

**Why table variable, not temp table, for the driving set?** For small sets
(<1,000 rows), table variables with a PRIMARY KEY are preferred:
- The PK provides a unique clustered index
- No TempDB allocation overhead for the structure
- The optimizer sees it as a small set and chooses nested loops
- After INSERT, the optimizer knows the exact row count

### Temp table best practices

- Add indexes AFTER populating (faster inserts, accurate statistics).
- Don't explicitly DROP at proc end -- let it go out of scope for deferred
  cleanup, which enables temp table caching.
- Don't ALTER the schema after CREATE -- breaks caching.

### Table-valued parameters (TVPs) for passing lists

```sql
CREATE TYPE dbo.IdListType AS TABLE (Id INT NOT NULL PRIMARY KEY);

CREATE PROCEDURE dbo.usp_GetOrdersByIds
    @OrderIds dbo.IdListType READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SELECT o.* FROM Orders o
    INNER JOIN @OrderIds ids ON o.OrderId = ids.Id;
END;
```

TVPs replace CSV splitting, XML shredding, and dynamic IN lists.

### Dynamic SQL for "kitchen sink" search

Build conditional WHERE clauses with sp_executesql so each unique SQL text
gets its own cached plan:

```sql
DECLARE @sql NVARCHAR(MAX) = N'SELECT * FROM dbo.Orders WHERE 1 = 1';

IF @CustomerId IS NOT NULL
    SET @sql += N' AND CustomerId = @CustId';
IF @Status IS NOT NULL
    SET @sql += N' AND Status = @Status';

SET @sql += N' OPTION (RECOMPILE)';

EXEC sp_executesql @sql,
    N'@CustId INT, @Status NVARCHAR(20)',
    @CustId = @CustomerId, @Status = @Status;
```

---

## 5. TVFs and Views

### Inline TVFs: the gold standard

An inline TVF is a parameterized view -- the optimizer expands it inline,
full predicate pushdown, accurate cardinality, parallelism.

```sql
-- INLINE (good): single RETURN SELECT, fully optimizable
CREATE FUNCTION dbo.fn_GetActiveProjects(@TenantId INT)
RETURNS TABLE
AS
RETURN (
    SELECT ProjectId, Name FROM dbo.Projects
    WHERE TenantId = @TenantId AND Status = 'Active'
);
```

### Multi-statement TVFs: performance killers

MSTVFs have a fixed cardinality estimate (1 row pre-2014, 100 rows 2014+),
block parallelism, and prevent predicate pushdown. The optimizer treats them
as a black box.

```sql
-- MSTVF (bad): optimizer estimates 100 rows regardless of actual count
CREATE FUNCTION dbo.fn_Bad(@TenantId INT)
RETURNS @Results TABLE (ProjectId INT, Name NVARCHAR(200))
AS
BEGIN
    INSERT INTO @Results SELECT ... -- black box
    RETURN;
END;
```

**SQL Server 2017 (compat 140):** Interleaved Execution pauses optimization,
executes the MSTVF to get actual row counts, then resumes. Mitigates but
does not eliminate the problem -- inline TVFs remain superior.

**SQL Server 2019 (compat 150):** Scalar UDF Inlining transforms qualifying
scalar UDFs into inline expressions. Check eligibility:

```sql
SELECT OBJECT_NAME(object_id), is_inlineable FROM sys.sql_modules
WHERE OBJECTPROPERTY(object_id, 'IsScalarFunction') = 1;
```

### Indexed views

**Always use `WITH (NOEXPAND)`**, even on Enterprise Edition. Without it,
the optimizer won't auto-create statistics on the view, leading to
suboptimal plans (Paul White).

```sql
SELECT OrderDate, TotalAmount
FROM dbo.vw_OrderSummary WITH (NOEXPAND)
WHERE CustomerId = @CustomerId;
```

Standard Edition requires NOEXPAND to use the indexed view at all.

### Nested view anti-pattern

Nested views (views referencing views) cause the optimizer to expand all
layers into a single massive query tree with dozens of base tables. The
optimizer times out and picks a bad plan.

```sql
-- BAD: 3 layers deep, optimizer sees 12 joined tables
SELECT * FROM vw_ActiveOrderSummary  -- references vw_OrderDetails
                                     -- which references vw_BaseOrders

-- GOOD: inline the SQL or use indexed views
SELECT o.OrderId, o.OrderDate, c.Name, SUM(li.Amount) AS Total
FROM Orders o
JOIN Customers c ON o.CustomerId = c.CustomerId
JOIN LineItems li ON o.OrderId = li.OrderId
WHERE o.Status = 'Active'
GROUP BY o.OrderId, o.OrderDate, c.Name;
```

---

## 6. Parameter Sniffing

First execution's parameter values are "sniffed" to build the cached plan.
When data distribution is skewed, the cached plan is optimal for the first
caller and catastrophic for everyone else.

### Mitigation strategies (ranked)

**1. OPTION(RECOMPILE) -- statement-level (best for variable queries):**

```sql
SELECT * FROM Orders WHERE Status = @Status OPTION (RECOMPILE);
```

Fresh plan every execution. Sees runtime values. Only recompiles the
annotated statement, not the whole proc. Avoid on high-frequency OLTP.

**2. Dynamic SQL branching (best for kitchen-sink queries):**

Each unique SQL text string gets its own cached plan. See Section 4.

**3. OPTIMIZE FOR specific value:**

```sql
OPTION (OPTIMIZE FOR (@Status = 'Active'));
```

Hardcoded -- becomes stale if data distribution changes.

**4. OPTIMIZE FOR UNKNOWN:**

Uses density vector instead of sniffed value. Produces a mediocre
"middle of the road" plan for everyone.

**5. Query Store forced plans (best for production emergencies):**

```sql
EXEC sp_query_store_force_plan @query_id = 42, @plan_id = 7;
```

No code change required. Force a known-good plan.

**6. WITH RECOMPILE (procedure-level) -- usually worse:**

Recompiles the ENTIRE procedure every call. OPTION(RECOMPILE) on specific
statements is almost always better.

**7. The local variable trick -- usually wrong:**

```sql
DECLARE @LocalStatus VARCHAR(20) = @Status;
SELECT * FROM Orders WHERE Status = @LocalStatus;
```

Prevents sniffing but replaces it with density vector estimation (same as
OPTIMIZE FOR UNKNOWN). Misleads troubleshooting because local-variable
behavior in SSMS doesn't match parameterized proc behavior.

---

## 7. Cardinality Estimation and Statistics

### Legacy CE (70) vs New CE (120+)

| Aspect | Legacy CE (70) | New CE (120+) |
|---|---|---|
| Multi-predicate | Assumes full independence | Exponential backoff correlation |
| Ascending keys | Estimates 1 row beyond histogram | Estimates ~30% of table |
| Multiple OR | Independent formula | Exponential backoff |

### The 200-step histogram limit

SQL Server statistics have at most 200 histogram steps. For millions of
distinct values, each step covers a wide range. Workarounds: filtered
statistics on subsets, multi-column statistics for correlated columns.

### Statistics freshness

**Legacy threshold (compat < 130):** 500 + 20% of rows must change. For
10M rows = 2,000,500 changes needed. Catastrophically stale.

**SQL Server 2016+ (compat 130+):** Dynamic threshold using
`SQRT(1000 * rows)`. For 10M rows = ~100,000 changes. Much better, but
still supplement with scheduled manual updates on high-churn tables.

### Detect stale statistics

```sql
SELECT OBJECT_NAME(s.object_id) AS TableName, s.name AS StatName,
    sp.last_updated, sp.rows, sp.modification_counter,
    CAST(sp.modification_counter AS FLOAT) / NULLIF(sp.rows, 0) * 100 AS PctModified
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) sp
WHERE sp.modification_counter > 0
ORDER BY sp.modification_counter DESC;
```

### UPDATE STATISTICS: the real reason rebuilds "fix" things

`ALTER INDEX REBUILD` updates statistics with FULLSCAN. Often the statistics
refresh -- not the defrag -- is what fixes performance. You can get the same
benefit from `UPDATE STATISTICS ... WITH FULLSCAN` without the rebuild cost.

---

## 8. Plan Cache

### sp_executesql vs EXEC(@sql)

| Feature | sp_executesql | EXEC(@sql) |
|---|---|---|
| Plan reuse | High (parameterized) | Low (per unique string) |
| SQL injection | Protected (with params) | Vulnerable |
| Plan cache bloat | Minimal | Severe |

**Always** use sp_executesql with parameters for dynamic SQL.

### Plan cache bloat detection

```sql
SELECT COUNT(*) AS single_use_plans,
    SUM(CAST(size_in_bytes AS BIGINT)) / 1024 / 1024 AS wasted_mb
FROM sys.dm_exec_cached_plans
WHERE usecounts = 1 AND objtype = 'Adhoc';
```

### OPTIMIZE FOR AD HOC WORKLOADS

Stores only a plan stub on first execution, full plan on second. Reduces
memory from single-use plans but masks the real problem (non-parameterized
queries). Not a blanket best practice -- fix parameterization instead.

---

## 9. Execution Plans: What to Look For

### Read plans right-to-left, top-to-bottom. Always use ACTUAL plans.

### Red flags

| Signal | Meaning | Fix |
|---|---|---|
| Key Lookup / RID Lookup | NCI found rows but needs columns from CI | Add INCLUDE columns to make covering index |
| Yellow triangle (!) | Spill, implicit conversion, missing stats | Investigate the specific warning |
| Thick arrows suddenly appearing | Data multiplication (bad join, Cartesian) | Check join predicates |
| Estimated vs Actual row discrepancy >10x | Wrong plan shape, wrong memory grant | Update statistics, check SARGability |
| Sort operator | Requires memory grant, can spill | Provide index that delivers rows in order |
| Hash Match warning | Hash table spilled to TempDB | Fix cardinality estimate (root cause) |
| Table/Clustered Index Scan on large table | Missing index or non-SARGable predicate | Add appropriate index, fix predicate |
| Eager Spool / Table Spool | Materializing intermediate results | May indicate inefficient subquery |
| `StatementOptmEarlyAbortReason="TimeOut"` | Optimizer gave up -- plan is too complex to optimize in time | CTE expansion through UNION ALL, nested views, or too many joins. Materialize CTEs into temp tables to reduce plan complexity |

### The tipping point

At ~1-3% of total rows, the optimizer switches from nonclustered index seek
+ Key Lookup to a full clustered index scan. A covering index eliminates
this threshold entirely.

---

## 10. Concurrency

### RCSI vs SNAPSHOT isolation

| | RCSI | SNAPSHOT |
|---|---|---|
| Enable | `ALTER DATABASE SET READ_COMMITTED_SNAPSHOT ON` | `ALTER DATABASE SET ALLOW_SNAPSHOT_ISOLATION ON` |
| Transaction starts with | Automatic (replaces READ COMMITTED) | `SET TRANSACTION ISOLATION LEVEL SNAPSHOT` |
| Reads see | Last committed at **statement** start | Last committed at **transaction** start |
| Write conflicts | No (writers still block writers) | Yes -- error 3960 if row changed since snapshot |
| Best for | General OLTP (default choice) | Long-running reports needing point-in-time consistency |

**Start with RCSI.** It's transparent -- existing code doesn't change. It
eliminates 60-90% of deadlocks because readers no longer take shared locks.

```sql
ALTER DATABASE [YourDb] SET READ_COMMITTED_SNAPSHOT ON;
```

Requires brief exclusive access. Uses TempDB version store.

### Deadlock prevention

1. **Enable RCSI** -- eliminates reader-writer deadlocks entirely
2. **Consistent access order** -- all transactions access tables in the same
   order
3. **Covering indexes** -- eliminates bookmark lookup deadlocks (the most
   common and subtle pattern)
4. **Keep transactions short** -- do computation outside the transaction
5. **Use UPDLOCK for upserts** -- prevents conversion deadlocks

### Bookmark lookup deadlock

Query A seeks NCI (S lock), needs Key Lookup to CI. Query B updates CI (X
lock), needs to update NCI. Cycle. Fix: covering index eliminates the lookup.

### Lock escalation

SQL Server escalates row/page locks to table lock at ~5,000 locks per
transaction. Prevent:

- Batch large operations (see Section 12)
- `ALTER TABLE dbo.Orders SET (LOCK_ESCALATION = AUTO)` for partitioned
  tables
- Create covering indexes to reduce lock scope (seeks hold fewer locks than
  scans)

### Deadlock graph extraction

The system_health Extended Events session captures deadlocks automatically:

```sql
SELECT xdr.value('@timestamp', 'datetime2') AS deadlock_time,
    xdr.query('.') AS deadlock_graph
FROM (
    SELECT CAST(target_data AS XML) AS TargetData
    FROM sys.dm_xe_session_targets st
    JOIN sys.dm_xe_sessions s ON s.address = st.event_session_address
    WHERE s.name = 'system_health' AND st.target_name = 'ring_buffer'
) AS Data
CROSS APPLY TargetData.nodes(
    'RingBufferTarget/event[@name="xml_deadlock_report"]'
) AS XEventData(xdr);
```

In the graph: **process-list** shows each session's SQL and lock held/wanted.
**resource-list** shows the contended objects. The victim is the lower-cost
transaction to roll back.

### Transaction management

- Do all reads and computation BEFORE `BEGIN TRANSACTION`
- Inside the transaction: only DML + COMMIT
- Never do API calls, network I/O, or user interaction inside a transaction

---

## 11. TempDB

### Spills

Sort, Hash Match, and Exchange operators spill to TempDB when their memory
grant is insufficient. Root cause is almost always bad cardinality estimates.

**Detection (SQL Server 2017 CU3+):**

```sql
SELECT qs.total_spills, qs.max_spills, qs.execution_count,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(st.text)
          ELSE qs.statement_end_offset END
          - qs.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
WHERE qs.total_spills > 0
ORDER BY qs.total_spills DESC;
```

**Fix spills by fixing cardinality estimates** (update statistics, rewrite
non-SARGable predicates), not by throwing more memory at the problem.

### Memory grant control

```sql
-- Cap a query's grant to prevent over-allocation
OPTION (MAX_GRANT_PERCENT = 10);

-- Ensure minimum grant for known-large sorts
OPTION (MIN_GRANT_PERCENT = 5);
```

### TempDB contention

Under heavy concurrent temp table creation, PFS/GAM/SGAM allocation pages
become hot spots (`PAGELATCH_UP`/`PAGELATCH_EX` waits on `2:1:1`).

| Version | Fix |
|---|---|
| Pre-2016 | TF 1118 + multiple equal-sized data files (1 per core, up to 8) |
| 2016+ | TF 1118 is default. Still need multiple files. |
| 2019+ | Enable memory-optimized TempDB metadata |

---

## 12. Batch Processing

### Chunked deletes/updates

Batch large operations to avoid lock escalation and log explosion:

```sql
DECLARE @BatchSize INT = 4000;  -- Under 5000 to avoid lock escalation
DECLARE @RowsAffected INT = 1;

WHILE @RowsAffected > 0
BEGIN
    DELETE TOP (@BatchSize) FROM dbo.AuditLog
    WHERE CreatedAt < DATEADD(YEAR, -2, GETUTCDATE());

    SET @RowsAffected = @@ROWCOUNT;
END;
```

An index on the WHERE clause column is essential -- without it, each batch
does a full table scan.

---

## 13. Data Types and Performance

### Key type impact

| Type | Size | Index Impact |
|---|---|---|
| INT | 4 bytes | Most compact, best for joins |
| BIGINT | 8 bytes | 2x INT, use when exceeding 2.1B |
| UNIQUEIDENTIFIER | 16 bytes | 4x INT; NEWID() causes page splits |

Use INT/BIGINT IDENTITY for clustered keys. If you need GUIDs, make them a
nonclustered unique index and use IDENTITY as the clustered key.

### VARCHAR vs NVARCHAR memory impact

Memory grants for sorts and hash operations are estimated from declared
column width. NVARCHAR(4000) reserves 2x the memory of VARCHAR(4000). Use
VARCHAR when data is ASCII-only (codes, identifiers, paths).

### Detect implicit conversions in plan cache

```sql
SELECT qs.total_logical_reads, qs.execution_count, qp.query_plan
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
WHERE CAST(qp.query_plan AS NVARCHAR(MAX)) LIKE '%CONVERT_IMPLICIT%'
ORDER BY qs.total_logical_reads DESC;
```

---

## 14. Compression

### ROW vs PAGE

| Type | How it works | Best for | CPU overhead |
|---|---|---|---|
| ROW | Variable-length storage for fixed types | NULLable columns, narrow ints | 2-5% |
| PAGE | ROW + prefix + dictionary compression | Repetitive data, read-heavy | 5-10% |

Most SQL Server workloads are I/O-bound, so compression usually helps.
Fewer pages = fewer reads = faster queries. The CPU cost of decompression is
overwhelmed by I/O savings.

```sql
-- Estimate savings before applying
EXEC sp_estimate_data_compression_savings 'dbo', 'Sales', NULL, NULL, 'PAGE';

-- Apply (ONLINE for Enterprise)
ALTER TABLE dbo.Sales REBUILD WITH (DATA_COMPRESSION = PAGE, ONLINE = ON);
```

---

## 15. Intelligent Query Processing (by Version)

### SQL Server 2017 (compat 140)

- **Adaptive Joins** -- chooses Hash vs Nested Loop at runtime
- **Interleaved Execution** -- actual row counts for MSTVFs
- **Batch Mode on Columnstore**

### SQL Server 2019 (compat 150)

- **Batch Mode on Rowstore** -- batch processing without columnstore
- **Scalar UDF Inlining** -- transforms qualifying scalar UDFs inline
- **Table Variable Deferred Compilation** -- actual cardinality
- **Memory Grant Feedback** -- auto-adjusts grants after execution
- **APPROX_COUNT_DISTINCT** -- HyperLogLog, <2% error, no spills

### SQL Server 2022 (compat 160)

- **Parameter Sensitive Plan (PSP)** -- multiple sub-plans per parameter
  range (equality predicates, one param at a time)
- **CE Feedback** -- corrects cardinality model per query via Query Store
- **DOP Feedback** -- auto-adjusts parallelism
- **Memory Grant Feedback with Percentile Persistence** -- survives restarts
- **Optimized Plan Forcing** -- faster re-compilation of forced plans

**All 2022 IQP features require Query Store enabled** (default ON for new
databases in 2022).

### Columnstore: maximize segment elimination

Load data sorted by the primary filter column (usually a date). Each
rowgroup stores min/max metadata per segment -- tight ranges mean the
optimizer skips entire segments with zero I/O. Random insert order produces
wide, overlapping ranges that defeat elimination.

---

## 16. Query Store

### Configuration (2022 defaults)

```sql
ALTER DATABASE MyDb SET QUERY_STORE = ON (
    OPERATION_MODE = READ_WRITE,
    MAX_STORAGE_SIZE_MB = 1024,
    INTERVAL_LENGTH_MINUTES = 60,
    STALE_QUERY_THRESHOLD_DAYS = 30,
    QUERY_CAPTURE_MODE = AUTO,
    WAIT_STATS_CAPTURE_MODE = ON
);
```

### Automatic plan correction

```sql
ALTER DATABASE MyDb SET AUTOMATIC_TUNING (FORCE_LAST_GOOD_PLAN = ON);
```

Monitors for plan regressions and auto-forces last known good plan when
estimated CPU gain exceeds 10 seconds.

### Query Store hints (2022+, no code change needed)

```sql
EXEC sys.sp_query_store_set_hints
    @query_id = 39,
    @query_hints = N'OPTION(USE HINT(''FORCE_LEGACY_CARDINALITY_ESTIMATION''))';
```

---

## 17. Parallelism (MAXDOP)

### Server-level defaults

| Cores | Recommended MAXDOP |
|---|---|
| 1-8 | Number of cores |
| 9-16 | 8 |
| 17+ | 8 or half of cores (test both) |

```sql
-- Set server default
EXEC sp_configure 'max degree of parallelism', 8;
RECONFIGURE;

-- Set cost threshold (default 5 is too low -- most queries go parallel)
EXEC sp_configure 'cost threshold for parallelism', 50;
RECONFIGURE;
```

### Per-query control

```sql
-- Force serial execution for a small OLTP query
SELECT * FROM Orders WHERE Id = @Id OPTION (MAXDOP 1);

-- Limit parallelism for a medium query
SELECT ... GROUP BY ... OPTION (MAXDOP 4);
```

**Rule:** OLTP point lookups should run serial (MAXDOP 1). Analytical
aggregations benefit from parallelism. If CXPACKET/CXCONSUMER is your top
wait, don't lower MAXDOP globally -- find the queries with bad plans that
are over-parallelized and fix those specifically.

---

## 18. Diagnostic Queries

### Quick diagnostics: SET STATISTICS

```sql
-- Show I/O per table (logical reads = buffer pool pages accessed)
SET STATISTICS IO ON;

-- Show elapsed and CPU time
SET STATISTICS TIME ON;

-- Run your query, then read the Messages tab
-- "logical reads" is the key metric. Fewer = faster.
```

**Logical reads are the universal metric.** A query doing 50,000 logical
reads that drops to 200 after adding a covering index just got ~250x faster.

### Who is blocking whom right now?

```sql
SELECT r.session_id AS blocked, r.blocking_session_id AS blocker,
    r.wait_type, r.wait_time / 1000 AS wait_sec,
    blocked_text.text AS blocked_query,
    blocker_text.text AS blocker_query
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) blocked_text
OUTER APPLY (
    SELECT sql_handle FROM sys.dm_exec_requests r2
    WHERE r2.session_id = r.blocking_session_id
) bq
OUTER APPLY sys.dm_exec_sql_text(bq.sql_handle) blocker_text
WHERE r.blocking_session_id > 0;
```

### Extended Events: lightweight production monitoring

```sql
-- Capture slow queries (>5s) and deadlocks with minimal overhead
CREATE EVENT SESSION [PerfMonitor] ON SERVER
ADD EVENT sqlserver.sql_statement_completed (
    WHERE duration > 5000000),  -- 5 seconds in microseconds
ADD EVENT sqlserver.xml_deadlock_report
ADD TARGET package0.event_file (
    SET filename = N'PerfMonitor.xel', max_file_size = 100)
WITH (MAX_MEMORY = 4096 KB, MAX_DISPATCH_LATENCY = 30 SECONDS);
ALTER EVENT SESSION [PerfMonitor] ON SERVER STATE = START;
```

### Top queries by CPU

```sql
SELECT TOP 25
    qs.total_worker_time / 1000 AS total_cpu_ms,
    qs.total_worker_time / qs.execution_count / 1000 AS avg_cpu_ms,
    qs.execution_count,
    qs.total_logical_reads / qs.execution_count AS avg_logical_reads,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(st.text)
          ELSE qs.statement_end_offset END
          - qs.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY qs.total_worker_time DESC;
```

### Top queries by logical reads

Same query, `ORDER BY qs.total_logical_reads DESC`. Tuning the highest
logical readers often yields the biggest gains -- reducing I/O reduces CPU
and duration.

### Find unused indexes (pure write overhead)

```sql
SELECT OBJECT_SCHEMA_NAME(i.object_id) + '.' + OBJECT_NAME(i.object_id) AS tbl,
    i.name AS idx, s.user_seeks, s.user_scans, s.user_updates
FROM sys.dm_db_index_usage_stats s
JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE s.database_id = DB_ID()
  AND OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1
  AND i.type_desc = 'NONCLUSTERED'
  AND s.user_seeks = 0 AND s.user_scans = 0 AND s.user_lookups = 0
  AND s.user_updates > 0
ORDER BY s.user_updates DESC;
```

Wait at least 30 days (full business cycle) before trusting these numbers.
Stats reset on restart.

### Missing index suggestions (with ESR consolidation)

```sql
SELECT
    CONVERT(DECIMAL(18,2), gs.avg_total_user_cost * gs.avg_user_impact
        * (gs.user_seeks + gs.user_scans)) AS improvement_measure,
    d.statement, d.equality_columns, d.inequality_columns,
    d.included_columns, gs.user_seeks, gs.avg_user_impact
FROM sys.dm_db_missing_index_group_stats gs
JOIN sys.dm_db_missing_index_groups g ON gs.group_handle = g.index_group_handle
JOIN sys.dm_db_missing_index_details d ON g.index_handle = d.index_handle
ORDER BY improvement_measure DESC;
```

**Review, consolidate, and apply ESR rule. Never auto-create.**

### Wait statistics

Use the **SQLskills wait stats query** (Paul Randal) which filters out
~60 benign background waits. Full script:
[sqlskills.com/blogs/paul/wait-statistics-or-please-tell-me-where-it-hurts](https://www.sqlskills.com/blogs/paul/wait-statistics-or-please-tell-me-where-it-hurts/)

Quick version (shows top waits by percentage, no background noise):

```sql
SELECT TOP 10 wait_type,
    wait_time_ms / 1000.0 AS wait_s,
    100.0 * wait_time_ms / SUM(wait_time_ms) OVER() AS pct,
    waiting_tasks_count
FROM sys.dm_os_wait_stats
WHERE wait_type NOT LIKE 'BROKER%'
  AND wait_type NOT LIKE 'SLEEP%'
  AND wait_type NOT LIKE 'HADR%'
  AND wait_type NOT LIKE 'QDS%'
  AND wait_type NOT LIKE 'XE%'
  AND wait_type NOT LIKE 'PARALLEL_REDO%'
  AND wait_type NOT IN (
      'CLR_SEMAPHORE','LAZYWRITER_SLEEP','RESOURCE_QUEUE',
      'SQLTRACE_BUFFER_FLUSH','WAITFOR','KSOURCE_WAKEUP',
      'CHECKPOINT_QUEUE','LOGMGR_QUEUE','DIRTY_PAGE_POLL',
      'FT_IFTS_SCHEDULER_IDLE_WAIT','DISPATCHER_QUEUE_SEMAPHORE',
      'CHKPT','SOS_WORK_DISPATCHER','SP_SERVER_DIAGNOSTICS_SLEEP',
      'REQUEST_FOR_DEADLOCK_SEARCH','ONDEMAND_TASK_QUEUE',
      'WAIT_FOR_RESULTS','CLR_AUTO_EVENT','CLR_MANUAL_EVENT'
  )
  AND waiting_tasks_count > 0
ORDER BY wait_time_ms DESC;
```

### Common wait types cheat sheet

| Wait | Meaning | Action |
|---|---|---|
| **CXPACKET/CXCONSUMER** | Parallel thread sync | Investigate underlying plan, not MAXDOP |
| **PAGEIOLATCH_SH** | Reading pages from disk | Memory pressure or heavy I/O; add RAM or optimize queries |
| **LCK_M_S/X/IX** | Lock blocking | Long transactions, missing indexes; consider RCSI |
| **SOS_SCHEDULER_YIELD** | CPU saturation | Tune expensive queries, add CPU |
| **ASYNC_NETWORK_IO** | Client consuming rows too slowly | Fix application (not SQL Server) |
| **WRITELOG** | Transaction log writes | Slow log disk or micro-transactions |

---

## 19. Index Maintenance: Modern Thinking

### Stop obsessing over fragmentation

On SSDs, random I/O is nearly as fast as sequential -- fragmentation has
minimal read impact. The real costs are wasted page space and extra pages in
buffer pool.

**What actually matters more than fragmentation:**

- Statistics freshness (root cause of "rebuilt indexes fixed performance")
- Parameter sniffing
- Page density (low density wastes buffer pool)

### If you must defrag (Brent Ozar's modern thresholds)

| Action | Threshold |
|---|---|
| Reorganize | 50% fragmentation (not 10-30%) |
| Rebuild | 80%+ (not 30%) |
| Frequency | Weekly at most. Not nightly. |
| Skip | Indexes under 1,000 pages |

### Always pair with statistics update

```sql
-- Ola Hallengren's maintenance solution (industry standard)
EXECUTE dbo.IndexOptimize
    @Databases = 'USER_DATABASES',
    @FragmentationLow = NULL,
    @FragmentationMedium = 'INDEX_REORGANIZE',
    @FragmentationHigh = 'INDEX_REBUILD_ONLINE,INDEX_REBUILD_OFFLINE',
    @FragmentationLevel1 = 50,
    @FragmentationLevel2 = 80,
    @MinNumberOfPages = 1000,
    @UpdateStatistics = 'ALL',
    @OnlyModifiedStatistics = 'Y';
```

---

## 20. Partitioning

### Partitioning is a manageability feature, not a performance feature

Good for: sliding window data management (instant partition SWITCH vs
log-heavy DELETE), partial index rebuilds, filegroup management.

**Partition elimination** only works when the partition key appears directly
in the WHERE clause. Without it, ALL partitions are scanned.

```sql
-- Partition elimination WORKS (SaleDate is the partition key)
SELECT SUM(Amount) FROM Sales
WHERE SaleDate >= '2024-01-01' AND SaleDate < '2024-02-01';
-- Only reads the January 2024 partition

-- Partition elimination FAILS (no partition key in WHERE)
SELECT * FROM Sales WHERE CustomerId = 12345;
-- Scans ALL partitions -- slower than an unpartitioned table with a good index
```

### When partitioning hurts

- TOP/MIN/MAX without partition key: evaluates all partitions
- Singleton lookups without partition key: per-partition seek across all
- Aligned NCIs must include partition key, making indexes wider
- Adds query plan complexity

---

## Performance Code Review Checklist

When writing or reviewing T-SQL for performance:

- [ ] All WHERE predicates are SARGable (no functions on columns)
- [ ] No implicit type conversions (parameter types match column types)
- [ ] Indexes follow ESR rule (Equality, Sort, Range, INCLUDE)
- [ ] No Key Lookups on high-volume queries (covering indexes)
- [ ] Inline TVFs, not multi-statement TVFs
- [ ] #Temp tables for >100 rows, not table variables (pre-2019)
- [ ] EXISTS for semi-joins, NOT EXISTS for anti-joins
- [ ] Keyset pagination for deep pages, not OFFSET/FETCH
- [ ] ROWS not RANGE for window function frames
- [ ] UNION ALL unless DISTINCT is required
- [ ] No MERGE -- use UPDATE-then-INSERT upsert pattern
- [ ] Batch large deletes/updates under 5,000 rows per batch
- [ ] OPTION(RECOMPILE) on queries with highly variable parameters
- [ ] STRING_AGG over FOR XML PATH (2017+)
- [ ] WITH (NOEXPAND) on all indexed view references
- [ ] CTEs referenced in multiple UNION ALL branches are materialized into #temp tables
- [ ] CROSS APPLY VALUES for unpivoting fixed rows instead of UNION ALL branches
- [ ] Small driving sets use table variables with PRIMARY KEY, not bare scans
- [ ] Performance changes validated with SET STATISTICS IO (logical reads comparison)

## Expert Tools

- **sp_BlitzIndex** (Brent Ozar) -- index health: unused, duplicates, missing
- **sp_BlitzCache** (Brent Ozar) -- worst cached plans with warnings
- **sp_BlitzFirst** (Brent Ozar) -- "why is the server slow right now?"
- **Ola Hallengren's Maintenance Solution** -- index/statistics maintenance

## Related Skills

- **sql-server** -- schema design, data types, temporal tables, JSON, masking
- **sql-server-safety** -- NULLIF guards, XACT_ABORT, ;THROW, injection
- **multi-tenant-safety** -- TenantId isolation, hardcoded ID detection
- **prisma-safety** -- ORM-level transaction patterns
- **sql-integration-testing** -- Testcontainers, stored procedure testing
