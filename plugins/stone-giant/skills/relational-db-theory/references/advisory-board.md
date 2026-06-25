# The Advisory Board

Imagine these legendary database theorists are on your team, reviewing every schema decision. Channel their wisdom:

## E.F. Codd - The Father of Relational Theory

> "The relational model provides a means of describing data with its natural structure only."

Edgar F. Codd invented the relational model in 1970 at IBM. His 12 rules define what makes a database truly relational. He proved that set-based operations on normalized tables could replace the navigational nightmares of hierarchical and network databases.

```text
KEY CONTRIBUTIONS:
- The relational model (1970 paper "A Relational Model of Data for Large Shared Data Banks")
- Normal forms (1NF, 2NF, 3NF, BCNF)
- Codd's 12 Rules (13 rules, 0-12)
- NULL handling theory
- Relational algebra and calculus

ASK YOURSELF:
- Is this data in its "natural structure" or am I forcing it into an artificial shape?
- Am I navigating through pointers, or operating on sets?
- Does my design require the application to know physical storage details?

CODD WOULD SAY:
"If you're chasing pointers through your data, you've left
the relational model. Return to sets. Return to logic.
The structure of the data should reflect the structure of reality,
not the structure of your storage medium."
```

## C.J. Date - The Relational Educator

> "The relational model is the foundation. Everything else is implementation."

Chris Date has spent decades explaining and defending relational theory through books like "An Introduction to Database Systems" and "Database in Depth." He's the clearest voice for understanding what the relational model actually says (vs. what SQL vendors implemented).

```text
KEY CONTRIBUTIONS:
- "An Introduction to Database Systems" (the definitive textbook)
- "Database in Depth: Relational Theory for Practitioners"
- "SQL and Relational Theory" (bridging theory and practice)
- Rigorous definition of relational concepts
- Critique of SQL's deviations from relational theory

ASK YOURSELF:
- Am I confusing SQL (the language) with relational theory (the model)?
- Do I understand WHY the theory recommends this, not just WHAT it recommends?
- Am I using NULL when I should be using a proper relation?
- Have I confused a table with a relation?

DATE WOULD SAY:
"SQL is not the relational model. It's a flawed approximation.
Understand the theory, then use SQL as a tool while avoiding its pitfalls.
NULL is not a value - it's the absence of a value, and mixing it with
three-valued logic creates more problems than it solves."
```

## Joe Celko - The SQL Pragmatist

> "Think in sets, not in rows."

Joe Celko bridges theory and practice. His "SQL for Smarties" series shows how to write elegant, set-based SQL instead of row-by-row procedural code. He teaches practical patterns while respecting relational foundations.

```text
KEY CONTRIBUTIONS:
- "SQL for Smarties" series (patterns for real problems)
- "SQL Programming Style" (consistent, readable SQL)
- "Trees and Hierarchies in SQL" (nested sets, adjacency lists)
- Set-based thinking methodology
- Practical anti-pattern identification

ASK YOURSELF:
- Am I processing one row at a time when I should use a single set operation?
- Can this cursor/loop be replaced with a single query?
- Am I using SQL idioms or fighting against them?
- Does this query read like a sentence describing WHAT I want?

CELKO WOULD SAY:
"If you're iterating through a cursor, you're writing COBOL with
SELECT statements. SQL is a declarative, set-oriented language.
Tell the database WHAT you want, not HOW to get it row by row.
The optimizer knows the HOW better than you do."
```

## Fabian Pascal - The Relational Purist

> "Logical database design is about meaning, not performance."

Fabian Pascal is the most uncompromising voice for relational purity. His book "Practical Issues in Database Management" and his blog "The PostWest" hold practitioners accountable to proper theory. He argues most database problems stem from misunderstanding fundamentals.

```text
KEY CONTRIBUTIONS:
- "Practical Issues in Database Management" (applying theory correctly)
- The PostWest blog (ongoing relational advocacy)
- Critique of industry's abandonment of relational principles
- Clear distinction between logical and physical design
- Defense of integrity constraints

ASK YOURSELF:
- Am I making a logical design decision based on physical considerations?
- Have I confused convenience with correctness?
- Would this design make sense to someone who knows the business, not just the tech?
- Am I enforcing business rules in the database or hoping the app does it?

PASCAL WOULD SAY:
"The industry's problems aren't technical - they're educational.
Practitioners don't understand fundamentals. They chase NoSQL,
denormalization, and 'flexibility' because they never learned
why the relational model works. Integrity constraints belong
in the database. Period. The app layer WILL make mistakes."
```

## Consulting the Board

When facing a database design decision, run it past the masters:

```text
SCHEMA DESIGN       -> Ask Codd (is this the natural structure?)
UNDERSTANDING WHY   -> Ask Date (what does the theory actually say?)
PRACTICAL SQL       -> Ask Celko (is there a set-based solution?)
INTEGRITY/PURITY    -> Ask Pascal (am I enforcing rules correctly?)

When theory and practice seem to conflict:
- Date reminds you: theory and practice CAN align if you understand both
- Celko shows you: there's usually a set-based solution you haven't seen
- Pascal warns you: shortcuts create long-term technical debt

When considering denormalization:
- Codd asks: "Is the data still in its natural structure?"
- Date asks: "Do you understand what you're sacrificing?"
- Celko asks: "Have you measured the actual performance problem?"
- Pascal asks: "Is this a real requirement or premature optimization?"

The deciding question (all would agree):
"Does this design enforce data integrity, or does it hope
the application layer will handle it?"
```

## The Masters' Shared Principles

Despite their different emphases, they would all agree:

```text
1. DATA INTEGRITY IS NON-NEGOTIABLE
   The database must enforce rules. The app layer will fail.

2. LOGICAL DESIGN PRECEDES PHYSICAL
   Design for meaning first. Optimize for performance second.

3. NULL IS PROBLEMATIC
   Avoid it when possible. Understand its three-valued logic when you can't.

4. THINK IN SETS
   Relational operations work on sets, not individual rows.

5. NORMALIZE BY DEFAULT
   Denormalize only with measurement, justification, and documentation.

6. CONSTRAINTS BELONG IN THE DATABASE
   CHECK, FOREIGN KEY, UNIQUE, NOT NULL - use them all.

7. UNDERSTAND THE THEORY
   SQL ≠ relational model. Know the difference.

8. NAMES MATTER
   Tables, columns, and constraints should reflect business meaning.
```
