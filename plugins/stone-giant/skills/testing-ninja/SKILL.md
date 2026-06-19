---
description: Pragmatic testing guidance for JS/TS, React, and React Router. Focuses on confidence-to-effort ratio, behavioral testing, and avoiding brittle implementation-detail tests. Use when writing Vitest, Playwright, or React Testing Library code.
triggers:
  patterns:
    - "*.test.ts"
    - "*.test.tsx"
    - "*.spec.ts"
    - "*.spec.tsx"
    - "vitest.config.ts"
    - "playwright.config.ts"
    - "tests/e2e/**/*"
---

# JS Ninja: Testing Strategy

Act as a senior engineer who views tests as insurance, not a religion. The goal is to prevent regressions and document intent without slowing down the ship cycle.

## Core Philosophy

**Confidence over Coverage.** 100% code coverage is a vanity metric that often leads to brittle tests. Aim for 70-80% covering "happy paths" and "nasty edges."

**Test Behavior, Not Implementation.** If you refactor a function's internals but the output remains the same, your tests should not break. Avoid testing private methods or internal component state.

**The ROI Hierarchy:**

1. **Integration (Highest ROI):** Test loaders, actions, and components together.
2. **Unit (Logic Heavy):** Test complex business logic, math, and data transformations.
3. **E2E (Critical Path):** Playwright for "must-not-fail" flows (Auth, Checkout).

## Testing Architecture

| Level       | Tool         | Focus                        | Speed   |
| ----------- | ------------ | ---------------------------- | ------- |
| Unit        | Vitest       | Logic, Math, Transformers    | Blazing |
| Integration | Vitest + RTL | Loaders, Actions, Components | Fast    |
| E2E         | Playwright   | Critical User Flows          | Slower  |

## Workflow Commands

Use the project's package manager (detect from lock file: bun.lockb, pnpm-lock.yaml, yarn.lock, or package-lock.json).

```bash
# Daily driver - runs affected tests on change
<pkg> test

# Visual dashboard for debugging complex logic
<pkg> test:ui

# Step through Playwright tests frame-by-frame
<pkg> test:e2e:ui

# Pre-push validation (types + tests + E2E)
<pkg> validate
```

## Standards & Patterns

### 1. Integration Testing (React Router v7)

"Don't mock the router, use the router." Use createRoutesStub to test the full data lifecycle.

```typescript
// Integration: Loader -> Component
test("displays user profile from loader", async () => {
  const Stub = createRoutesStub([
    {
      path: "/profile/:id",
      Component: ProfilePage,
      loader: () => ({ user: { name: "Ninja", bio: "Ship it." } }),
    },
  ]);

  render(<Stub initialEntries={["/profile/1"]} />);
  expect(await screen.findByText("Ninja")).toBeInTheDocument();
});
```

### 2. Action Testing (React Router v7)

Test actions as pure functions using Web Standard Request/FormData. Mock the model, not the action.

```typescript
// app/routes/project.create.test.ts
import { action } from "./project.create";
import { createProject } from "~/models/project.model.server";

vi.mock("~/models/project.model.server", () => ({
  createProject: vi.fn(),
}));

describe("Project Create Action", () => {
  it("redirects on successful creation", async () => {
    // Use real FormData - tests validation logic properly
    const formData = new FormData();
    formData.append("name", "New Ninja Project");

    const request = new Request("http://test.com/projects/new", {
      method: "POST",
      body: formData,
    });

    vi.mocked(createProject).mockResolvedValue({
      id: "123",
      name: "New Ninja Project",
    });

    const response = await action({ request, params: {}, context: {} });

    // Redirects are just 302 responses with Location header
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/projects");
  });

  it("returns validation errors for missing data", async () => {
    const request = new Request("http://test.com/projects/new", {
      method: "POST",
      body: new FormData(), // Empty form
    });

    const response = await action({ request, params: {}, context: {} });

    expect(response.errors).toBeDefined();
    expect(createProject).not.toHaveBeenCalled();
  });
});
```

### 3. Behavioral Component Testing

"If the user can't see it, your test shouldn't either." Query by role and text.

```typescript
// GOOD: Testing behavior
test("toggles menu on click", async () => {
  render(<Nav />);
  const trigger = screen.getByRole("button", { name: /open menu/i });
  await userEvent.click(trigger);
  expect(screen.getByRole("menu")).toBeVisible();
});

// BAD: Testing implementation (checking state/classes)
expect(wrapper.state("isOpen")).toBe(true);
expect(element).toHaveClass("css-1492xj");
```

### 4. Effective Mocking (MSW)

"Mock the network, not the code." Use Mock Service Worker (MSW) to intercept fetches. This keeps application code "pure" and unaware of the test environment.

```typescript
// MSW Handler - works for Vitest and Playwright
export const handlers = [
  http.get("/api/projects", () => {
    return HttpResponse.json([{ id: "1", name: "Ninja App" }]);
  }),
];

// NEVER: Manual module mocks for data fetching
vi.mock("~/models/db.server", () => ({ ... }));
```

### 5. Data Factories (Fishery)

Use factories over static fixtures. Highlights only the data relevant to each test case.

```typescript
// tests/factories/user.factory.ts
import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import type { User } from "~/models/user.model.server";

export const userFactory = Factory.define<User>(({ sequence }) => ({
  id: sequence.toString(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: "USER",
  createdAt: new Date(),
}));

// In tests: only override what matters
test("only admins can delete locked projects", async () => {
  const adminUser = userFactory.build({ role: "ADMIN" });
  const lockedProject = projectFactory.build({ status: "locked" });

  expect(canDeleteProject(adminUser, lockedProject)).toBe(true);
});
```

**Factories + MSW:**

```typescript
// src/mocks/handlers.ts
import { projectFactory } from "tests/factories/project.factory";

export const handlers = [
  http.get("/api/projects", () => {
    // Generate realistic data on the fly
    return HttpResponse.json(projectFactory.buildList(5));
  }),
];
```

### 6. E2E Testing (Playwright)

Test critical user journeys from a real browser perspective.

**Ninja Strategies:**

1. **One-Database Rule**: Use a dedicated test database, reset/seeded before test runs
2. **Avoid CSS Selectors**: Never use `.btn-primary` or `#submit-01`
3. **Use Semantic Locators**: `getByRole`, `getByText`, `getByLabel`
4. **Auth via Storage State**: Log in once, save cookies, reuse for all tests

**Happy Path Pattern:**

```typescript
// tests/e2e/create-project.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Project Lifecycle", () => {
  test("user can log in and create a new project", async ({ page }) => {
    // 1. Setup
    await page.goto("/login");

    // 2. Act: Log in
    await page.getByLabel(/email/i).fill("user@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /log in/i }).click();

    // 3. Verify: Check redirect
    await expect(page).toHaveURL(/\/projects/);

    // 4. Act: Create Project
    await page.getByRole("link", { name: /new project/i }).click();
    await page.getByLabel(/project name/i).fill("E2E Test Project");
    await page.getByRole("button", { name: /create/i }).click();

    // 5. Assert: Success state
    await expect(page.getByText(/project created successfully/i)).toBeVisible();
  });
});
```

## Test Organization

```text
project/
  app/
    components/
      Button.tsx
      Button.test.tsx        # Component tests
    routes/
      api.user.ts
      api.user.test.ts       # Loader/Action tests
    models/
      user.model.server.ts
      user.model.server.test.ts  # Model tests
  tests/
    e2e/
      .auth/
        user.json            # Stored auth state
      auth.setup.ts          # Auth setup project
      auth.spec.ts           # Auth flow tests
      happy-path.spec.ts     # Critical journeys
```

## Testing Checklist

- [ ] **Arrange-Act-Assert:** Is there clear separation between setup, execution, and verification?
- [ ] **No "Sleep":** Use findBy or waitFor instead of setTimeout.
- [ ] **Deterministic:** Does the test pass 100/100 times? No flakiness allowed.
- [ ] **Clean Slate:** Are database/store/mocks reset between every test?
- [ ] **Edge Cases:** Did you test the 500 error, the empty array, and the loading state?
- [ ] Unit tests cover pure business logic
- [ ] Integration tests cover loaders and actions
- [ ] E2E tests cover the "Happy Path" - the most critical user flow
- [ ] MSW handlers mock external API calls
- [ ] Auth state is reused across E2E tests (not logged in fresh each time)
- [ ] Tests use semantic locators (`getByRole`, `getByLabel`)
- [ ] `pnpm validate` passes before pushing

## Anti-Patterns to Call Out

- **Snapshot Testing Everything:** Leads to "Update Snapshots" fatigue. Use only for small, stable UI chunks.
- **Testing the Library:** Don't test that React Router navigates; test that your code triggers the navigation.
- **Deep Nesting:** If a test file has 5+ levels of describe blocks, it's a code smell. Keep it flat.
- **Logic in Tests:** If your test needs a for loop or complex if statement, the test itself is prone to bugs. Keep it linear.
- **Mocking FormData:** Use real `new FormData()` to test validation logic properly.
- **Static Fixtures:** 20-line objects at the top of every test file. Use factories instead.

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/validate.yml`) runs:

1. **validate job**: Typecheck + Unit Tests (fast feedback)
2. **e2e job**: Playwright E2E (runs only if validate passes)

Failed E2E tests upload artifacts (screenshots, videos) for debugging.
