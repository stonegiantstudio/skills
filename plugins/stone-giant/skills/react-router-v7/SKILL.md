---
description: React + React Router v7 framework mode expertise for Remix-style full-stack applications. Triggers when writing general React components (memoization, state derivation, keys, anti-useEffect patterns) or editing loaders, actions, route modules, react-router.config.ts, middleware, or any file importing from react-router or @react-router/*. Use for React patterns, route data loading, mutations, error handling, form submissions, redirects, revalidation, client/server code splitting, RSC patterns, thin routes/fat models architecture, and CSRF protection configuration.
---

# React + React Router v7

React Router v7 is the successor to Remix, providing a full-stack framework with file-based routing, data loading, and server rendering built on Vite. This skill owns both React Router patterns and general React patterns for this codebase. For language-level JS/TS (async, types, falsy gotchas, modern features), see `js-ninja`.

## General React Patterns

Before reaching for React Router specifics, get the React fundamentals right.

### Memoization: Profile First

`useMemo` and `useCallback` have overhead of their own. React is fast. Measure before memoizing.

```typescript
// ❌ Cargo-culted memoization
const double = useMemo(() => x * 2, [x]); // Cheaper to just compute

// ✅ Memoize only when profiled hot path or referential equality matters
const expensiveResult = useMemo(() => heavyCompute(items), [items]);
const stableHandler = useCallback(() => doThing(id), [id]); // passed to memo'd child
```

### Stable Keys — Never Array Indices

```typescript
// ❌ Breaks reconciliation on reorder/delete
{items.map((item, i) => <Row key={i} {...item} />)}

// ✅ Use stable, unique IDs from the data
{items.map(item => <Row key={item.id} {...item} />)}
```

### No useEffect for Derived State

```typescript
// ❌ Extra render + stale flash
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// ✅ Compute during render
const fullName = `${first} ${last}`;
```

See the [State Derivation Hierarchy](#state-derivation-hierarchy) below for the full decision tree when derivation alone isn't enough.

### No useLoaderData() in RRv7

```typescript
// ❌ Old Remix pattern
const data = useLoaderData<typeof loader>();

// ✅ RRv7 passes loader data via component props
export default function Page({ loaderData }: Route.ComponentProps) { /* ... */ }
```

## Route Module Exports

```typescript
// app/routes/posts.$id.tsx
import type { Route } from "./+types/posts.$id";

// Server-only data loading
export async function loader({ params, request }: Route.LoaderArgs) {
  const post = await db.post.findUnique({ where: { id: params.id } });
  if (!post) throw new Response("Not Found", { status: 404 });
  return { post };
}

// Server-only mutations
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await db.post.update({ where: { id: params.id }, data: Object.fromEntries(formData) });
  return redirect(`/posts/${params.id}`);
}

// Component receives loader data as props
export default function Post({ loaderData }: Route.ComponentProps) {
  return <article>{loaderData.post.content}</article>;
}

// Error boundary for this route
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return <div>{error.status}: {error.statusText}</div>;
  }
  return <div>Unexpected error</div>;
}
```

## Thin Routes, Fat Models

**Loaders and actions call models, not the database directly.** Keep database queries in model files. Routes stay thin — they orchestrate, models do the work.

```text
app/
├── models/                          # Database interaction layer
│   ├── user.model.server.ts         # User CRUD operations
│   ├── project.model.server.ts      # Project queries
│   └── database-connection.model.server.ts
├── routes/
│   └── projects.tsx                 # Loader calls model functions
└── lib/
    └── db.server.ts                 # Database client singleton
```

```typescript
// ✓ app/models/project.model.server.ts
import { db } from "~/lib/db.server";

export async function getProjectsByUserId(userId: string) {
  return db.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: desc(projects.updatedAt),
  });
}

export async function createProject(userId: string, data: CreateProjectInput) {
  const [project] = await db.insert(projects).values({
    userId,
    ...data,
  }).returning();
  return project;
}

// ✓ app/routes/projects.tsx — thin loader
import { getProjectsByUserId } from "~/models/project.model.server";

export async function loader({ context }: Route.LoaderArgs) {
  const userId = context.session.user.id;
  const projects = await getProjectsByUserId(userId);
  return { projects };
}

// ✗ NEVER: database queries in loaders
export async function loader({ context }: Route.LoaderArgs) {
  const projects = await db.query.projects.findMany({ /* ... */ }); // Wrong place
}
```

**Benefits:**

- Models are testable in isolation (mock db, test logic)
- Loaders stay focused on request/response handling
- Reusable queries across multiple routes
- Clear separation: models = data, routes = HTTP

## Data Patterns

**Returning data from loaders:**

```typescript
// Simple return (auto-serialized)
return { users, count };

// With response headers
return data({ users }, { headers: { "Cache-Control": "max-age=300" } });

// Throwing responses for non-2xx
throw data({ error: "Unauthorized" }, { status: 401 });
```

**Form mutations:**

```typescript
import { Form, useActionData, useNavigation } from "react-router";

function EditPost({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <Form method="post">
      <input name="title" defaultValue={loaderData.post.title} />
      {actionData?.errors?.title && <span>{actionData.errors.title}</span>}
      <button disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</button>
    </Form>
  );
}
```

## Fetcher Patterns

**The fetcher IS your state. Don't sync fetcher.data to useState - derive from it directly.**

```typescript
// ❌ ANTI-PATTERN: Syncing fetcher to state
const [success, setSuccess] = useState(false);
const fetcher = useFetcher();

useEffect(() => {
  if (fetcher.data?.success) {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }
}, [fetcher.data]);

// ✅ CORRECT: Derive state from fetcher
const fetcher = useFetcher();
const success = fetcher.data?.success === true;
```

**Derive UI state from fetcher + local state:**

```typescript
const fetcher = useFetcher();
const [inputValue, setInputValue] = useState("");

// Show success while input matches saved value
// Clears when user types something different
const showSuccess =
  fetcher.data?.saved === true &&
  inputValue === fetcher.data?.savedValue;
```

**Multiple fetchers - use keys:**

```typescript
// Each item gets its own fetcher instance
{items.map(item => (
  <ItemRow key={item.id} item={item} />
))}

function ItemRow({ item }) {
  // Key ensures this fetcher is unique to this item
  const fetcher = useFetcher({ key: `item-${item.id}` });
  const isDeleting = fetcher.state !== "idle";
  // ...
}
```

## State Derivation Hierarchy

When component state depends on props or other state, prefer these approaches in order:

**1. BEST — Pure derivation (no state needed):**

```typescript
// ✅ Just compute it during render
const fullName = `${first} ${last}`;
const filtered = items.filter(i => i.active);
```

**2. GOOD — Reset via key prop:**

```typescript
// ✅ Remount with fresh state when userId changes
<Profile userId={userId} key={userId} />
```

**3. ACCEPTABLE — setState during render (previous-value tracking):**

This is a documented React pattern (react.dev), NOT a legacy escape hatch. It skips the extra render cycle that useEffect causes.

```typescript
// ✅ Valid — React aborts the render and re-renders with new state
const [prevItems, setPrevItems] = useState(items);
const [selection, setSelection] = useState<string | null>(null);
if (items !== prevItems) {
  setPrevItems(items);
  setSelection(null);
}
```

**4. WORST — useEffect to sync state (extra render, stale flash):**

```typescript
// ❌ Renders with stale selection, then re-renders
useEffect(() => {
  setSelection(null);
}, [items]);
```

Prefer pure derivation whenever possible. Most "derived state" problems disappear when you compute values during render without any state. Reserve setState-during-render for cases where you genuinely need to detect a prop change and reset local state.

## Form vs fetcher.Form

```typescript
// <Form> - navigates, shows global pending UI, updates URL
// Use for: search, filters, full-page mutations
<Form method="post" action="/posts/new">

// <fetcher.Form> - no navigation, local pending state
// Use for: inline edits, toggles, "like" buttons, deletions
<fetcher.Form method="post" action="/api/favorite">
```

## Pending UI - Don't useState for Loading

```typescript
// ❌ ANTI-PATTERN
const [isLoading, setIsLoading] = useState(false);
const handleClick = async () => {
  setIsLoading(true);
  await fetch("/api/thing");
  setIsLoading(false);
};

// ✅ CORRECT: Use navigation/fetcher state
const navigation = useNavigation();
const isLoading = navigation.state === "submitting";

// Or with fetcher:
const fetcher = useFetcher();
const isLoading = fetcher.state !== "idle";
```

## URL as State - Don't useState for Filters

```typescript
// ❌ ANTI-PATTERN: Client state for filters
const [filter, setFilter] = useState("all");
const [sort, setSort] = useState("newest");
// Lost on refresh, can't share URL, back button broken

// ✅ CORRECT: URL search params
const [searchParams, setSearchParams] = useSearchParams();
const filter = searchParams.get("filter") ?? "all";
const sort = searchParams.get("sort") ?? "newest";

// Updates URL, triggers loader revalidation
setSearchParams({ filter: "active", sort });
```

**When to use URL state:**

- Filters, search, pagination
- Tab selection
- Modal open state (if shareable)
- Anything user might want to bookmark/share

## Progressive Enhancement

Forms should work without JavaScript:

```typescript
// ✅ Works with and without JS
<Form method="post" action="/subscribe">
  <input name="email" />
  <button>Subscribe</button>
</Form>

// ❌ Breaks without JS
<form onSubmit={(e) => {
  e.preventDefault();
  fetch("/api/subscribe", { ... });
}}>
```

## Action Patterns - Redirect vs Return

```typescript
// After successful mutation: REDIRECT
// Prevents "resubmit form?" on refresh
export async function action({ request }) {
  await createPost(data);
  return redirect("/posts"); // ✅
}

// For validation errors: RETURN (don't redirect)
// User stays on form, sees errors, can fix
export async function action({ request }) {
  const errors = validate(data);
  if (errors) {
    return { errors }; // ✅ Return, don't redirect
  }
  await createPost(data);
  return redirect("/posts");
}
```

## Intent Pattern - Multiple Actions

```typescript
export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  switch (intent) {
    case "update": return handleUpdate(formData);
    case "delete": return handleDelete(formData);
    case "publish": return handlePublish(formData);
    default: throw new Response("Invalid intent", { status: 400 });
  }
}

// In component - button name/value sets intent
<fetcher.Form method="post">
  <button name="intent" value="publish">Publish</button>
  <button name="intent" value="delete">Delete</button>
</fetcher.Form>
```

## Optimistic UI

```typescript
const fetcher = useFetcher();

// Optimistic: show pending state immediately
const isLiked = fetcher.formData
  ? fetcher.formData.get("liked") === "true"  // Optimistic
  : post.isLiked;                              // Server truth

<fetcher.Form method="post">
  <input type="hidden" name="liked" value={(!isLiked).toString()} />
  <button>{isLiked ? "❤️" : "🤍"}</button>
</fetcher.Form>
```

## Parallel Data Loading - Avoid Waterfalls

```typescript
// ❌ WATERFALL: Sequential awaits
export async function loader() {
  const user = await getUser();      // 100ms
  const posts = await getPosts();    // 100ms
  const comments = await getComments(); // 100ms
  return { user, posts, comments };  // Total: 300ms
}

// ✅ PARALLEL: Promise.all
export async function loader() {
  const [user, posts, comments] = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ]);
  return { user, posts, comments };  // Total: 100ms
}
```

## Don't Fetch in useEffect

```typescript
// ❌ ANTI-PATTERN: Client-side fetch
useEffect(() => {
  fetch("/api/data").then(r => r.json()).then(setData);
}, []);

// ✅ CORRECT: Use a loader (runs on server, cached, revalidates)
export async function loader() {
  return { data: await getData() };
}

// Or if you need client-only data, use clientLoader
export async function clientLoader() {
  return { data: await getClientData() };
}
```

## Revalidation - Embrace It

After any action, React Router revalidates all loaders on the page.
**This is a feature, not a bug. Don't fight it.**

```typescript
// If you need to prevent revalidation for a specific route:
export function shouldRevalidate({ actionResult, defaultShouldRevalidate }) {
  // Only skip if action explicitly says so
  if (actionResult?.skipRevalidation) return false;
  return defaultShouldRevalidate;
}
```

## Client Loaders/Actions

For client-side data (localStorage, IndexedDB, client APIs):

```typescript
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const serverData = await serverLoader();
  const clientPrefs = localStorage.getItem("prefs");
  return { ...serverData, prefs: JSON.parse(clientPrefs ?? "{}") };
}
clientLoader.hydrate = true; // Run on initial hydration

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  const result = await serverAction();
  localStorage.setItem("lastEdit", Date.now().toString());
  return result;
}
```

## Configuration (react-router.config.ts)

```typescript
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,                    // SSR enabled (default)
  // ssr: false,                // SPA mode
  
  // Pre-rendering
  async prerender() {
    return ["/", "/about"];
  },
  
  // CSRF - allow external origins (v7.11+)
  allowedActionOrigins: ["https://trusted-partner.com"],
  
  // Future flags
  future: {
    unstable_trailingSlashAwareDataRequests: true,
  },
} satisfies Config;
```

## Error Handling

**Stabilized onError (v7.11+):**

```tsx
// app/entry.client.tsx
<HydratedRouter onError={(error, errorInfo) => {
  trackError(error, { componentStack: errorInfo.componentStack });
}} />
```

## Revalidation Control

```typescript
// Route-level control
export function shouldRevalidate({ defaultShouldRevalidate, currentUrl, nextUrl }) {
  if (currentUrl.pathname === nextUrl.pathname) return false;
  return defaultShouldRevalidate;
}

// Call-site opt-out (unstable, v7.11+)
navigate("/path", { unstable_defaultShouldRevalidate: false });
```

## Reference Files

Read the appropriate reference based on task:

- **[route-module.md](route-module.md)**: Deep dive on loaders, actions, clientLoader/clientAction, HydrateFallback, ErrorBoundary, headers, handle, links, meta, shouldRevalidate exports
- **[middleware.md](middleware.md)**: Server/client middleware patterns, auth, logging, context API, AsyncLocalStorage with RSC
- **[type-safety.md](type-safety.md)**: Typegen setup, tsconfig, Route type helper, AppLoadContext typing, monorepo issues
- **[changelog.md](changelog.md)**: v7.11-7.12 updates, security CVEs, migration notes

## Quick Fixes

| Issue                                          | Solution                                       |
| ---------------------------------------------- | ---------------------------------------------- |
| `generatePath` with `/books/:id.json`          | Fixed in v7.12                                 |
| HMR "Maximum call stack" with cyclic imports   | Fixed in v7.12                                 |
| External form submissions blocked              | Add origin to `allowedActionOrigins` config    |
| Missing route types                            | Run `npx react-router typegen`                 |
