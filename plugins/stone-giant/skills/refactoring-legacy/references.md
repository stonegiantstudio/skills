# References and Further Reading

## Primary Sources

### Michael Feathers - Working Effectively with Legacy Code (2004)

The definitive guide to testing and refactoring legacy code.

**Key Concepts:**

- **Legacy Code Definition**: "Legacy code is simply code without tests"
- **The Legacy Code Dilemma**: You need tests to refactor safely, but you need
  to refactor to add tests
- **Seams**: Places where you can alter behavior without editing code
- **Characterization Tests**: Tests that document what code actually does
- **The Legacy Code Change Algorithm**: Identify, find test points, break
  dependencies, write tests, make changes

**24 Dependency-Breaking Techniques:**

1. Adapt Parameter
2. Break Out Method Object
3. Definition Completion
4. Encapsulate Global References
5. Expose Static Method
6. Extract and Override Call
7. Extract and Override Factory Method
8. Extract and Override Getter
9. Extract Implementer
10. Extract Interface
11. Introduce Instance Delegator
12. Introduce Static Setter
13. Link Substitution
14. Parameterize Constructor
15. Parameterize Method
16. Primitivize Parameter
17. Pull Up Feature
18. Push Down Dependency
19. Replace Function with Function Pointer
20. Replace Global Reference with Getter
21. Subclass and Override Method
22. Supersede Instance Variable
23. Template Redefinition
24. Text Redefinition

---

### Martin Fowler - Refactoring: Improving the Design of Existing Code (2018, 2nd ed.)

The catalog of refactoring patterns.

**Key Concepts:**

- **Refactoring Definition**: "A change made to the internal structure of
  software to make it easier to understand and cheaper to modify without
  changing its observable behavior"
- **Code Smells**: Indicators that code may need refactoring
- **Mechanics**: Step-by-step instructions for each refactoring

**Catalog Categories:**

- Composing Methods (Extract Function, Inline Function, etc.)
- Moving Features (Move Function, Move Field, etc.)
- Organizing Data (Replace Primitive with Object, etc.)
- Simplifying Conditional Logic (Decompose Conditional, etc.)
- Refactoring APIs (Separate Query from Modifier, etc.)
- Dealing with Inheritance (Pull Up Method, Push Down Method, etc.)

**Online Catalog:** https://refactoring.com/catalog/

---

### Joshua Kerievsky - Refactoring to Patterns (2004)

Bridges refactoring and design patterns.

**Key Concepts:**

- **Pattern-Directed Refactoring**: Refactoring toward (or away from) patterns
- **Evolutionary Design**: Patterns emerge through refactoring
- **Over-Engineering**: Patterns applied too early create complexity

**Key Refactorings:**

- Replace Conditional Dispatcher with Command
- Replace Conditional Logic with Strategy
- Replace State-Altering Conditionals with State
- Replace Type Code with Class
- Unify Interfaces with Adapter

---

### Martin Fowler - Strangler Fig Application (2004)

Pattern for incremental legacy system replacement.

**Key Concepts:**

- **Named After**: Strangler figs that grow around host trees
- **Incremental Replacement**: Replace piece by piece, not all at once
- **Facade/Proxy**: Intercepts requests, routes to old or new system
- **Risk Reduction**: Smaller changes, easier rollback

**Steps:**

1. **Identify**: Choose bounded context to extract
2. **Transform**: Build new implementation
3. **Co-exist**: Route traffic gradually
4. **Eliminate**: Remove legacy when complete

**Original Article:** https://martinfowler.com/bliki/StranglerFigApplication.html

---

### Brian Foote & Joseph Yoder - Big Ball of Mud (1999)

Seminal paper on architectural anti-patterns.

**Key Concepts:**

- **Big Ball of Mud**: "A haphazardly structured, sprawling, sloppy,
  duct-tape-and-baling-wire, spaghetti-code jungle"
- **Forces That Create Mud**: Time pressure, inexperience, turnover, entropy
- **Patterns for Managing Mud**: Throwaway Code, Piecemeal Growth, Keep It
  Working, Shearing Layers, Sweeping It Under the Rug, Reconstruction

**Key Quote:**

> "If you think good architecture is expensive, try bad architecture."

**Original Paper:** https://www.laputan.org/mud/

---

## Testing Techniques

### Golden Master Testing / Approval Testing

**Concept**: Capture output of legacy code, use as baseline for comparison.

**Tools:**

- **JavaScript/TypeScript**: Jest snapshots, Vitest snapshots
- **Java**: ApprovalTests
- **C#**: ApprovalTests.Net
- **.NET**: Verify

**Process:**

1. Generate deterministic inputs
2. Run code, capture outputs
3. Save as "golden master"
4. After changes, compare to master
5. Investigate any differences

**Key Resource:** https://approvaltests.com/

---

### Characterization Testing

**Concept**: Write tests that describe what code actually does.

**Process:**

1. Write test with placeholder expected value
2. Run test, observe actual value
3. Update test with actual value
4. Test now documents real behavior

**Difference from Unit Tests:**

- Unit tests: Test what code *should* do
- Characterization tests: Document what code *actually* does

---

## Code Smells Reference

From Fowler's "Refactoring":

|Smell|Description|Typical Refactoring|
|---|---|---|
|Duplicated Code|Same structure in multiple places|Extract Function, Pull Up Method|
|Long Method|Method doing too much|Extract Function|
|Large Class|Class with too many responsibilities|Extract Class|
|Long Parameter List|Too many parameters|Introduce Parameter Object|
|Divergent Change|One class changed for different reasons|Extract Class|
|Shotgun Surgery|One change affects many classes|Move Method, Move Field|
|Feature Envy|Method uses another class's data|Move Method|
|Data Clumps|Data items that appear together|Extract Class|
|Primitive Obsession|Primitives instead of small objects|Replace Primitive with Object|
|Switch Statements|Type-based switching|Replace Conditional with Polymorphism|
|Parallel Inheritance|Adding subclass requires adding another|Move Method, Move Field|
|Lazy Class|Class that doesn't do enough|Inline Class|
|Speculative Generality|Unused abstraction|Collapse Hierarchy, Inline|
|Temporary Field|Fields only set in certain circumstances|Extract Class|
|Message Chains|Long chains of method calls|Hide Delegate|
|Middle Man|Class that just delegates|Remove Middle Man|
|Inappropriate Intimacy|Classes too involved with each other|Move Method, Extract Class|
|Alternative Classes|Different classes with similar interfaces|Rename, Move Method|
|Incomplete Library Class|Library missing needed features|Introduce Foreign Method|
|Data Class|Class with only fields and accessors|Move Method|
|Refused Bequest|Subclass doesn't use inherited interface|Replace Inheritance with Delegation|
|Comments|Comments explaining bad code|Refactor the code instead|

---

## Practice Resources

### Katas for Practice

- **Gilded Rose Kata**: https://github.com/emilybache/GildedRose-Refactoring-Kata
- **Tennis Refactoring Kata**: https://github.com/emilybache/Tennis-Refactoring-Kata
- **Trivia Kata**: https://github.com/jbrains/trivia
- **Trip Service Kata**: https://github.com/sandromancuso/trip-service-kata

### Books for Deep Dives

- *Working Effectively with Legacy Code* - Michael Feathers
- *Refactoring* (2nd Edition) - Martin Fowler
- *Refactoring to Patterns* - Joshua Kerievsky
- *Clean Code* - Robert C. Martin
- *The Pragmatic Programmer* - Hunt & Thomas

### Online Resources

- Refactoring.com: https://refactoring.com/
- Refactoring.guru: https://refactoring.guru/
- Understand Legacy Code: https://understandlegacycode.com/
- Approval Tests: https://approvaltests.com/

---

## Integration with Other Skills

**systems-thinking** (sibling skill):

- Use BEFORE refactoring to find all affected code
- Creates impact map of files to change
- Ensures no duplicate is left behind

**agent-philosophy** (reference for principles):

- Explains WHY refactoring matters
- Ousterhout on complexity
- Fowler on code smells
- Hunt & Thomas on DRY

**testing-ninja** (if available):

- Detailed test writing guidance
- Framework-specific patterns
- Test organization strategies
