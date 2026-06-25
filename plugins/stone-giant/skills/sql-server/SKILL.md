---
description: SQL Server and Azure SQL database design with proper types, naming conventions, indexing strategies, temporal tables, dynamic data masking, and T-SQL patterns. Use when designing schemas, writing DDL, or working with SQL Server or Azure SQL databases.
metadata:
  triggers:
    patterns:
      - "*.sql"
    keywords:
      - "sql server"
      - "azure sql"
      - "t-sql"
      - "tsql"
      - "mssql"
      - "nvarchar"
      - "datetime2"
      - "uniqueidentifier"
      - "temporal table"
---

# SQL Server & Azure SQL Database Design

Database design guidance specific to Microsoft SQL Server and Azure SQL Database. This skill covers SQL Server-specific patterns—for universal relational theory (normalization, keys, constraints), see the `relational-db-theory` skill.

## Azure SQL vs On-Premises: Critical Differences

**Read this first.** Azure SQL Database has significant limitations compared to on-premises SQL Server.

### Commands NOT Supported in Azure SQL Database

```sql
-- ❌ NEVER USE THESE IN AZURE SQL DATABASE

USE master;                    -- Cannot switch databases; use separate connections
USE [OtherDatabase];           -- Same limitation

BACKUP DATABASE ...            -- Managed by Azure (automatic backups)
RESTORE DATABASE ...           -- Use Azure portal or PITR

sp_configure ...               -- Use ALTER DATABASE SCOPED CONFIGURATION instead
RECONFIGURE;

SHUTDOWN;                      -- Not applicable

-- Cross-database queries (limited)
SELECT * FROM OtherDb.dbo.Table;  -- Use elastic query for read-only access
```

### Feature Comparison

| Feature | On-Premises | Azure SQL DB | Azure SQL MI |
|---------|-------------|--------------|--------------|
| USE statement | ✅ | ❌ | ✅ |
| Cross-database queries | ✅ | ❌ (elastic query only) | ✅ |
| Windows Authentication | ✅ | ❌ | ✅ |
| SQL Server Agent | ✅ | ❌ (use Azure Automation) | ✅ |
| Linked Servers | ✅ | ❌ | ✅ |
| CLR Integration | ✅ | ❌ | ✅ |
| BACKUP/RESTORE | ✅ | ❌ (managed) | ✅ (to URL) |
| Filestream/Filetable | ✅ | ❌ | ❌ |
| Replication | ✅ | Subscriber only | ✅ |
| Always On AG | ✅ | ❌ (built-in HA) | ❌ (built-in HA) |

### Azure SQL Authentication

```sql
-- ❌ Windows Authentication NOT supported in Azure SQL Database
-- ✅ Use Microsoft Entra ID (formerly Azure AD) or SQL Authentication

-- Create contained database user (recommended for Azure SQL)
CREATE USER [app_user] WITH PASSWORD = 'SecurePassword123!';
ALTER ROLE db_datareader ADD MEMBER [app_user];
ALTER ROLE db_datawriter ADD MEMBER [app_user];

-- Entra ID user
CREATE USER [user@domain.com] FROM EXTERNAL PROVIDER;
```

---

## CRITICAL: Verify Before Writing SQL

**NEVER guess object names.** Before writing any DDL or DML:

```sql
-- List all tables
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;

-- Search for tables by pattern
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME LIKE '%user%';

-- Get columns for a table
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Users'
ORDER BY ORDINAL_POSITION;

-- Get foreign keys
SELECT
    fk.name AS ConstraintName,
    tp.name AS ParentTable,
    cp.name AS ParentColumn,
    tr.name AS ReferencedTable,
    cr.name AS ReferencedColumn
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc
    ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
INNER JOIN sys.columns cp
    ON fkc.parent_object_id = cp.object_id
    AND fkc.parent_column_id = cp.column_id
INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
INNER JOIN sys.columns cr
    ON fkc.referenced_object_id = cr.object_id
    AND fkc.referenced_column_id = cr.column_id
WHERE tp.name = 'Posts';

-- Get indexes
SELECT
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique,
    i.is_primary_key,
    STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS Columns
FROM sys.indexes i
INNER JOIN sys.index_columns ic
    ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c
    ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE OBJECT_NAME(i.object_id) = 'Users'
  AND i.name IS NOT NULL
GROUP BY i.name, i.type_desc, i.is_unique, i.is_primary_key;
```

---

## Data Types

### Preferred Types

| Use Case | Type | Notes |
|----------|------|-------|
| Text (Unicode) | `NVARCHAR(n)` or `NVARCHAR(MAX)` | **Always** for international text |
| Text (ASCII only) | `VARCHAR(n)` or `VARCHAR(MAX)` | Only when certain ASCII-only |
| Timestamps | `DATETIME2(7)` | Higher precision than DATETIME |
| Timestamps + TZ | `DATETIMEOFFSET(7)` | Stores timezone offset |
| Boolean | `BIT` | 0/1 (no native BOOLEAN) |
| Integer | `INT` | -2B to +2B |
| Large integer | `BIGINT` | IDs, counts exceeding 2B |
| Money/currency | `DECIMAL(p,s)` | **Never** use MONEY type |
| JSON data | `NVARCHAR(MAX)` | With JSON functions |
| Unique identifier | `UNIQUEIDENTIFIER` | 16-byte GUID |

### Primary Keys

```sql
-- Sequential GUID (best for clustered index performance)
Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()

-- Random GUID (causes fragmentation but globally unique)
Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID()

-- Auto-increment BIGINT (simple, performant)
Id BIGINT IDENTITY(1,1) NOT NULL

-- Auto-increment INT (for smaller tables)
Id INT IDENTITY(1,1) NOT NULL
```

**When to use which:**

- `NEWSEQUENTIALID()` - Best default for GUIDs (sequential = less fragmentation)
- `NEWID()` - When global uniqueness matters more than performance
- `IDENTITY` - Simple internal tables, better join performance

### Timestamps

```sql
-- High precision, no timezone (most common)
CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
UpdatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()

-- With timezone offset (when you need to preserve original TZ)
CreatedAt DATETIMEOFFSET(7) NOT NULL DEFAULT SYSDATETIMEOFFSET()

-- ❌ NEVER use DATETIME (precision issues, limited range)
-- CreatedAt DATETIME  -- 3.33ms precision, ends 2079
```

---

## Naming Conventions

### Tables

- **PascalCase**, plural
- Prefix with schema when not dbo

```sql
dbo.Users
dbo.BlogPosts
dbo.OrderLineItems

-- Junction tables
dbo.UserRoles
dbo.PostTags

-- Schema-organized
Sales.Orders
Sales.OrderItems
HR.Employees
```

### Columns

- **PascalCase**
- No table prefix

```sql
-- Primary key
Id

-- Foreign keys: singular entity + Id
UserId
OrganizationId

-- Booleans: Is/Has/Can/Should prefix
IsActive
HasVerifiedEmail
CanPublish
ShouldNotify

-- Timestamps: At suffix
CreatedAt
UpdatedAt
DeletedAt
PublishedAt

-- Counts
ViewCount
CommentCount
```

### Indexes and Constraints

```sql
-- Primary key: PK_TableName
CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id)

-- Foreign key: FK_ChildTable_ParentTable
CONSTRAINT FK_Posts_Users FOREIGN KEY (UserId) REFERENCES Users(Id)

-- Unique: UQ_TableName_Columns
CONSTRAINT UQ_Users_Email UNIQUE (Email)

-- Check: CK_TableName_Description
CONSTRAINT CK_Orders_QuantityPositive CHECK (Quantity > 0)

-- Default: DF_TableName_Column
CONSTRAINT DF_Users_CreatedAt DEFAULT GETUTCDATE() FOR CreatedAt

-- Index: IX_TableName_Columns
CREATE NONCLUSTERED INDEX IX_Posts_UserId ON Posts(UserId);
```

---

## Standard Table Template

```sql
CREATE TABLE dbo.Posts (
    -- Primary key
    Id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_Posts_Id DEFAULT NEWSEQUENTIALID(),

    -- Foreign keys
    UserId UNIQUEIDENTIFIER NOT NULL,
    CategoryId UNIQUEIDENTIFIER NULL,

    -- Business columns
    Title NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NULL,

    -- Status (SQL Server has no ENUM)
    Status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Posts_Status DEFAULT 'draft',

    -- Boolean
    IsFeatured BIT NOT NULL
        CONSTRAINT DF_Posts_IsFeatured DEFAULT 0,

    -- JSON data
    Metadata NVARCHAR(MAX) NULL,

    -- Timestamps
    CreatedAt DATETIME2(7) NOT NULL
        CONSTRAINT DF_Posts_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2(7) NOT NULL
        CONSTRAINT DF_Posts_UpdatedAt DEFAULT GETUTCDATE(),
    PublishedAt DATETIME2(7) NULL,

    -- Constraints
    CONSTRAINT PK_Posts PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Posts_Users FOREIGN KEY (UserId)
        REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Posts_Categories FOREIGN KEY (CategoryId)
        REFERENCES Categories(Id) ON DELETE SET NULL,
    CONSTRAINT UQ_Posts_Slug UNIQUE (Slug),
    CONSTRAINT CK_Posts_Status CHECK (Status IN ('draft', 'published', 'archived')),
    CONSTRAINT CK_Posts_TitleLength CHECK (LEN(Title) >= 1),
    CONSTRAINT CK_Posts_Metadata CHECK (Metadata IS NULL OR ISJSON(Metadata) = 1)
);

-- Always index foreign keys (SQL Server doesn't auto-index these!)
CREATE NONCLUSTERED INDEX IX_Posts_UserId ON Posts(UserId);
CREATE NONCLUSTERED INDEX IX_Posts_CategoryId ON Posts(CategoryId);

-- Index commonly filtered columns
CREATE NONCLUSTERED INDEX IX_Posts_Status ON Posts(Status);
CREATE NONCLUSTERED INDEX IX_Posts_CreatedAt ON Posts(CreatedAt DESC);

-- Filtered index for published posts only
CREATE NONCLUSTERED INDEX IX_Posts_PublishedAt_Active
ON Posts(PublishedAt)
WHERE Status = 'published';
```

---

## Temporal Tables (System-Versioned)

**Automatic history tracking** - SQL Server maintains a complete history of all changes.

### Creating a Temporal Table

```sql
CREATE TABLE dbo.Products (
    Id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_Products_Id DEFAULT NEWSEQUENTIALID(),
    Name NVARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    CategoryId UNIQUEIDENTIFIER NULL,

    -- Required: period columns (SQL Server manages these)
    ValidFrom DATETIME2(7) GENERATED ALWAYS AS ROW START NOT NULL,
    ValidTo DATETIME2(7) GENERATED ALWAYS AS ROW END NOT NULL,
    PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo),

    CONSTRAINT PK_Products PRIMARY KEY CLUSTERED (Id)
)
WITH (SYSTEM_VERSIONING = ON (
    HISTORY_TABLE = dbo.ProductsHistory,
    DATA_CONSISTENCY_CHECK = ON
));
```

### Querying Temporal Data

```sql
-- Current data only (default)
SELECT * FROM Products WHERE Id = @ProductId;

-- Data as it existed at a specific point in time
SELECT * FROM Products
FOR SYSTEM_TIME AS OF '2024-06-15 14:30:00'
WHERE Id = @ProductId;

-- All versions of a record
SELECT * FROM Products
FOR SYSTEM_TIME ALL
WHERE Id = @ProductId
ORDER BY ValidFrom;

-- Data within a time range
SELECT * FROM Products
FOR SYSTEM_TIME BETWEEN '2024-01-01' AND '2024-06-30'
WHERE Id = @ProductId;

-- Data that was valid during any part of a range
SELECT * FROM Products
FOR SYSTEM_TIME FROM '2024-01-01' TO '2024-06-30'
WHERE Id = @ProductId;

-- Data fully contained within a range
SELECT * FROM Products
FOR SYSTEM_TIME CONTAINED IN ('2024-01-01', '2024-06-30')
WHERE Id = @ProductId;
```

### Temporal Table Management

```sql
-- Disable versioning (required before schema changes)
ALTER TABLE Products SET (SYSTEM_VERSIONING = OFF);

-- Make schema changes...
ALTER TABLE Products ADD NewColumn NVARCHAR(50) NULL;
ALTER TABLE ProductsHistory ADD NewColumn NVARCHAR(50) NULL;

-- Re-enable versioning
ALTER TABLE Products SET (SYSTEM_VERSIONING = ON (
    HISTORY_TABLE = dbo.ProductsHistory
));

-- Query history table directly (when needed)
SELECT * FROM ProductsHistory WHERE Id = @ProductId;
```

### Converting Existing Table to Temporal

```sql
-- Add period columns
ALTER TABLE Products ADD
    ValidFrom DATETIME2(7) GENERATED ALWAYS AS ROW START
        CONSTRAINT DF_Products_ValidFrom DEFAULT SYSUTCDATETIME() NOT NULL,
    ValidTo DATETIME2(7) GENERATED ALWAYS AS ROW END
        CONSTRAINT DF_Products_ValidTo DEFAULT CONVERT(DATETIME2(7), '9999-12-31 23:59:59.9999999') NOT NULL,
    PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo);

-- Enable system versioning
ALTER TABLE Products SET (SYSTEM_VERSIONING = ON (
    HISTORY_TABLE = dbo.ProductsHistory
));
```

---

## Dynamic Data Masking

**Protect sensitive data** at the database level without changing application code.

### Masking Functions

```sql
-- Default mask: full masking
-- Numbers → 0, Strings → 'XXXX', Dates → 01-01-1900
Email NVARCHAR(255) MASKED WITH (FUNCTION = 'default()') NOT NULL

-- Email mask: shows first letter and domain
-- 'john.doe@example.com' → 'jXXX@XXXX.com'
Email NVARCHAR(255) MASKED WITH (FUNCTION = 'email()') NOT NULL

-- Partial mask: expose prefix and suffix
-- '1234567890' → '123XXXX890'
Phone NVARCHAR(20) MASKED WITH (FUNCTION = 'partial(3, "XXXX", 3)') NOT NULL

-- Random mask: random value within range (for numbers)
Salary DECIMAL(10,2) MASKED WITH (FUNCTION = 'random(10000, 50000)') NOT NULL
```

### Creating Masked Columns

```sql
CREATE TABLE dbo.Customers (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),

    -- Masked columns
    FirstName NVARCHAR(50) MASKED WITH (FUNCTION = 'partial(1, "***", 0)') NOT NULL,
    LastName NVARCHAR(50) MASKED WITH (FUNCTION = 'default()') NOT NULL,
    Email NVARCHAR(255) MASKED WITH (FUNCTION = 'email()') NOT NULL,
    Phone NVARCHAR(20) MASKED WITH (FUNCTION = 'partial(0, "XXX-XXX-", 4)') NULL,
    SSN CHAR(11) MASKED WITH (FUNCTION = 'partial(0, "XXX-XX-", 4)') NULL,
    CreditCardNumber NVARCHAR(20) MASKED WITH (FUNCTION = 'partial(0, "XXXX-XXXX-XXXX-", 4)') NULL,

    CONSTRAINT PK_Customers PRIMARY KEY (Id)
);

-- Add mask to existing column
ALTER TABLE Customers
ALTER COLUMN BirthDate ADD MASKED WITH (FUNCTION = 'default()');

-- Remove mask
ALTER TABLE Customers
ALTER COLUMN BirthDate DROP MASKED;
```

### Granting Unmask Permission

```sql
-- Users see masked data by default
-- Grant permission to see unmasked data
GRANT UNMASK TO [analytics_user];

-- Revoke unmask permission
REVOKE UNMASK FROM [analytics_user];

-- Column-level unmask (SQL Server 2022+)
GRANT UNMASK ON dbo.Customers(Email) TO [support_user];
```

### Querying Masked Data

```sql
-- Regular user sees:
-- FirstName: J***, Email: jXXX@XXXX.com, Phone: XXX-XXX-1234

-- User with UNMASK permission sees:
-- FirstName: John, Email: john@example.com, Phone: 555-123-1234

-- Check current user's mask visibility
SELECT
    c.name AS ColumnName,
    mc.masking_function
FROM sys.masked_columns mc
JOIN sys.columns c ON mc.object_id = c.object_id AND mc.column_id = c.column_id
WHERE mc.object_id = OBJECT_ID('Customers');
```

---

## JSON Support

### Storing JSON

```sql
-- Store as NVARCHAR(MAX) with validation constraint
Metadata NVARCHAR(MAX) NULL
    CONSTRAINT CK_Posts_Metadata CHECK (Metadata IS NULL OR ISJSON(Metadata) = 1)
```

### Querying JSON

```sql
-- Extract scalar value (returns NVARCHAR)
SELECT
    Id,
    Title,
    JSON_VALUE(Metadata, '$.author') AS Author,
    JSON_VALUE(Metadata, '$.stats.viewCount') AS ViewCount
FROM Posts;

-- Extract object or array (returns NVARCHAR with JSON)
SELECT JSON_QUERY(Metadata, '$.tags') AS Tags
FROM Posts;

-- Filter by JSON value
SELECT * FROM Posts
WHERE JSON_VALUE(Metadata, '$.featured') = 'true';

-- Check if path exists
SELECT * FROM Posts
WHERE JSON_VALUE(Metadata, '$.author') IS NOT NULL;

-- Parse JSON array into rows
SELECT p.Id, p.Title, t.value AS Tag
FROM Posts p
CROSS APPLY OPENJSON(JSON_QUERY(p.Metadata, '$.tags')) t;

-- Parse JSON object into columns
SELECT p.Id, j.*
FROM Posts p
CROSS APPLY OPENJSON(p.Metadata)
WITH (
    Author NVARCHAR(100) '$.author',
    ViewCount INT '$.stats.viewCount',
    Tags NVARCHAR(MAX) '$.tags' AS JSON
) j;
```

### Modifying JSON

```sql
-- Set/update a value
UPDATE Posts
SET Metadata = JSON_MODIFY(Metadata, '$.viewCount', 100)
WHERE Id = @PostId;

-- Set nested value
UPDATE Posts
SET Metadata = JSON_MODIFY(Metadata, '$.stats.viewCount', 100)
WHERE Id = @PostId;

-- Add new property
UPDATE Posts
SET Metadata = JSON_MODIFY(Metadata, '$.featured', 'true')
WHERE Id = @PostId;

-- Remove property (set to NULL)
UPDATE Posts
SET Metadata = JSON_MODIFY(Metadata, '$.deprecated', NULL)
WHERE Id = @PostId;

-- Append to array
UPDATE Posts
SET Metadata = JSON_MODIFY(
    Metadata,
    'append $.tags',
    'new-tag'
)
WHERE Id = @PostId;
```

### Indexing JSON for Performance

```sql
-- Add computed column for frequently queried JSON path
ALTER TABLE Posts
ADD Author AS JSON_VALUE(Metadata, '$.author');

-- Index the computed column
CREATE NONCLUSTERED INDEX IX_Posts_Author ON Posts(Author);

-- Or use a persisted computed column (stored, not calculated)
ALTER TABLE Posts
ADD ViewCount AS CAST(JSON_VALUE(Metadata, '$.stats.viewCount') AS INT) PERSISTED;

CREATE NONCLUSTERED INDEX IX_Posts_ViewCount ON Posts(ViewCount);
```

---

## Row-Level Security (RLS)

**Filter rows automatically** based on user context.

### Basic RLS Setup

```sql
-- Create security predicate function
CREATE FUNCTION dbo.fn_SecurityPredicate(@UserId UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS Result
WHERE @UserId = CAST(SESSION_CONTEXT(N'UserId') AS UNIQUEIDENTIFIER)
   OR IS_MEMBER('db_owner') = 1;

-- Create security policy
CREATE SECURITY POLICY dbo.PostsSecurityPolicy
ADD FILTER PREDICATE dbo.fn_SecurityPredicate(UserId) ON dbo.Posts,
ADD BLOCK PREDICATE dbo.fn_SecurityPredicate(UserId) ON dbo.Posts
WITH (STATE = ON);

-- Set context in application
EXEC sp_set_session_context @key = N'UserId', @value = @CurrentUserId;

-- Now queries automatically filter to current user's data
SELECT * FROM Posts;  -- Only sees their own posts
```

### Multi-Tenant RLS

```sql
-- Tenant isolation predicate
CREATE FUNCTION dbo.fn_TenantPredicate(@TenantId UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS Result
WHERE @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS UNIQUEIDENTIFIER);

-- Apply to all tenant tables
CREATE SECURITY POLICY dbo.TenantSecurityPolicy
ADD FILTER PREDICATE dbo.fn_TenantPredicate(TenantId) ON dbo.Users,
ADD FILTER PREDICATE dbo.fn_TenantPredicate(TenantId) ON dbo.Orders,
ADD FILTER PREDICATE dbo.fn_TenantPredicate(TenantId) ON dbo.Products
WITH (STATE = ON);
```

---

## Columnstore Indexes

**Analytics optimization** - Dramatically faster aggregations on large tables.

### When to Use Columnstore

- Analytical/reporting queries (SUM, AVG, COUNT, GROUP BY)
- Tables with millions+ rows
- Queries scanning many rows but few columns
- Data warehouse / OLAP workloads

### Clustered Columnstore (Replaces Heap/B-tree)

```sql
-- Best for pure analytics tables
CREATE TABLE dbo.SalesHistory (
    SaleDate DATE NOT NULL,
    ProductId INT NOT NULL,
    CustomerId INT NOT NULL,
    Quantity INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Region NVARCHAR(50) NOT NULL
);

CREATE CLUSTERED COLUMNSTORE INDEX CCI_SalesHistory ON SalesHistory;
```

### Nonclustered Columnstore (Hybrid)

```sql
-- Add analytics capability to OLTP table
-- Keep B-tree for transactional queries, add columnstore for analytics
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_Orders_Analytics
ON Orders (OrderDate, CustomerId, TotalAmount, Status);

-- Filtered columnstore (only archive data)
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_Orders_Archive
ON Orders (OrderDate, CustomerId, TotalAmount)
WHERE OrderDate < '2024-01-01';
```

### Columnstore Query Examples

```sql
-- These queries benefit enormously from columnstore
SELECT
    Region,
    YEAR(SaleDate) AS Year,
    SUM(Amount) AS TotalSales,
    COUNT(*) AS TransactionCount
FROM SalesHistory
GROUP BY Region, YEAR(SaleDate);

-- Segment elimination - only reads relevant segments
SELECT SUM(Amount)
FROM SalesHistory
WHERE SaleDate >= '2024-01-01' AND SaleDate < '2024-02-01';
```

---

## Computed Columns

### Virtual (Calculated on Read)

```sql
ALTER TABLE dbo.Orders
ADD TotalWithTax AS (Subtotal + TaxAmount);

-- Can be indexed if deterministic
CREATE INDEX IX_Orders_TotalWithTax ON Orders(TotalWithTax);
```

### Persisted (Stored on Write)

```sql
ALTER TABLE dbo.Users
ADD FullName AS (FirstName + ' ' + LastName) PERSISTED;

-- Always index persisted columns for best read performance
CREATE INDEX IX_Users_FullName ON Users(FullName);
```

### JSON Computed Columns

```sql
-- Extract JSON value as computed column
ALTER TABLE dbo.Posts
ADD AuthorName AS JSON_VALUE(Metadata, '$.author') PERSISTED;
```

---

## Indexing Strategies

### Index Types

| Type | Use Case |
|------|----------|
| **Clustered** | Primary key, range scans (one per table) |
| **Nonclustered** | Secondary lookups, foreign keys |
| **Filtered** | Subset of rows (active records, non-null values) |
| **Covering** | Include columns to avoid key lookups |
| **Columnstore** | Analytics, aggregations |
| **Full-text** | Text search |

### Filtered Indexes

```sql
-- Only index active users (smaller, faster)
CREATE NONCLUSTERED INDEX IX_Users_Email_Active
ON Users(Email)
WHERE IsActive = 1;

-- Only index non-null optional values
CREATE NONCLUSTERED INDEX IX_Orders_ShippedAt
ON Orders(ShippedAt)
WHERE ShippedAt IS NOT NULL;

-- Only index specific status
CREATE NONCLUSTERED INDEX IX_Orders_Pending
ON Orders(CreatedAt)
WHERE Status = 'pending';
```

### Covering Indexes (INCLUDE)

```sql
-- Avoid key lookups by including needed columns
CREATE NONCLUSTERED INDEX IX_Posts_UserId
ON Posts(UserId)
INCLUDE (Title, Status, CreatedAt);

-- Query uses only the index, no table access needed
SELECT Title, Status, CreatedAt
FROM Posts
WHERE UserId = @UserId;
```

### Index Maintenance

```sql
-- Check fragmentation
SELECT
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent,
    ips.page_count
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- Rebuild (offline, full rebuild)
ALTER INDEX IX_Posts_UserId ON Posts REBUILD;

-- Reorganize (online, less resource intensive)
ALTER INDEX IX_Posts_UserId ON Posts REORGANIZE;
```

---

## UpdatedAt Trigger

SQL Server requires a trigger for automatic timestamp updates:

```sql
CREATE OR ALTER TRIGGER TR_Posts_UpdatedAt
ON dbo.Posts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(UpdatedAt)  -- Prevent infinite recursion
    BEGIN
        UPDATE p
        SET UpdatedAt = GETUTCDATE()
        FROM dbo.Posts p
        INNER JOIN inserted i ON p.Id = i.Id;
    END
END;
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| `DATETIME` | 3.33ms precision, Y2K38 limit | Use `DATETIME2(7)` |
| `MONEY` | Rounding errors, 4 decimal places | Use `DECIMAL(p,s)` |
| `VARCHAR` for international | Can't store Unicode | Use `NVARCHAR` |
| Missing FK indexes | Slow JOINs, slow CASCADE | Always index FK columns |
| `FLOAT` for money | Precision errors | Use `DECIMAL(p,s)` |
| `SELECT *` | Schema changes break code | List columns explicitly |
| Cursors for set operations | Slow, row-by-row | Use set-based queries |
| `NOLOCK` everywhere | Dirty reads, inconsistent data | Use proper isolation levels |
| `USE [database]` in Azure SQL | Not supported | Use separate connections |
| Unnamed constraints | Hard to manage | Always name constraints |
| Non-persisted JSON columns | Slow repeated calculations | Use PERSISTED computed columns |

---

## Quick Reference

```text
TABLES:      PascalCase, plural            Users, BlogPosts, OrderItems
COLUMNS:     PascalCase                    UserId, CreatedAt, IsActive
PRIMARY KEY: Id (UNIQUEIDENTIFIER/BIGINT)  Id UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()
FOREIGN KEY: EntityId                      UserId REFERENCES Users(Id)
BOOLEAN:     Is/Has/Can + BIT              IsActive BIT DEFAULT 0
TIMESTAMP:   At + DATETIME2(7)             CreatedAt DATETIME2(7) DEFAULT GETUTCDATE()
UNICODE:     NVARCHAR (not VARCHAR)        Name NVARCHAR(100) NOT NULL
JSON:        NVARCHAR(MAX) + ISJSON        Metadata NVARCHAR(MAX) CHECK (ISJSON(Metadata)=1)
INDEX:       IX_Table_Columns              IX_Posts_UserId
CONSTRAINT:  Type_Table_Description        FK_Posts_Users, CK_Orders_Positive
TEMPORAL:    PERIOD FOR SYSTEM_TIME        FOR SYSTEM_TIME AS OF '2024-01-01'
MASKING:     MASKED WITH (FUNCTION=...)    MASKED WITH (FUNCTION = 'email()')
```

---

## References

- [T-SQL Differences: Azure SQL vs SQL Server](https://learn.microsoft.com/en-us/azure/azure-sql/database/transact-sql-tsql-differences-sql-server)
- [Temporal Tables](https://learn.microsoft.com/en-us/sql/relational-databases/tables/temporal-tables)
- [Dynamic Data Masking](https://learn.microsoft.com/en-us/sql/relational-databases/security/dynamic-data-masking)
- [Columnstore Indexes](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/columnstore-indexes-overview)
- [Row-Level Security](https://learn.microsoft.com/en-us/sql/relational-databases/security/row-level-security)
