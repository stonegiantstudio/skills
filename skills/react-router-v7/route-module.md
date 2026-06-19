# Route Module Reference

## Table of Contents

- [Loader Patterns](#loader-patterns)
- [Action Patterns](#action-patterns)
- [Client Loaders & Actions](#client-loaders--actions)
- [Component Props](#component-props)
- [Error Handling](#error-handling)
- [Revalidation](#revalidation)
- [Other Exports](#other-exports)

## Loader Patterns

### Basic Server Loader

```tsx
import type { Route } from "./+types/product";

export async function loader({ params, request }: Route.LoaderArgs) {
  // params: typed URL parameters from route path
  // request: standard Fetch Request object
  const product = await db.product.findUnique({ where: { id: params.id } });
  
  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }
  
  return { product };
}
```

### Using Request URL

```tsx
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("q");
  const page = parseInt(url.searchParams.get("page") || "1");
  
  return { results: await search(searchTerm, page) };
}
```

### Returning Responses

```tsx
import { data, redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  
  // Redirect if not authenticated
  if (!user) {
    return redirect("/login");
  }
  
  // Return data with custom status
  return data({ user }, { status: 200 });
}
```

### Parallel Data Loading

Loaders for matched routes run in parallel automatically. Parent and child route loaders execute simultaneously.

### Streaming with defer (deprecated pattern)

```tsx
// OLD - defer() is deprecated
import { defer } from "react-router";
export async function loader() {
  return defer({ data: slowFetch() }); // Don't use
}

// NEW - just return promises, React Suspense handles streaming
export async function loader() {
  return { 
    fast: await fastFetch(),
    slow: slowFetch() // Promise, not awaited
  };
}
```

## Action Patterns

### Basic Form Handling

```tsx
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  
  // Get form values
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  
  // Validate
  if (!title) {
    return data({ error: "Title required" }, { status: 400 });
  }
  
  // Mutate
  await db.product.update({
    where: { id: params.id },
    data: { title, description }
  });
  
  // Return or redirect
  return redirect(`/products/${params.id}`);
}
```

### Multiple Actions Pattern

```tsx
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  switch (intent) {
    case "create":
      return createItem(formData);
    case "update":
      return updateItem(formData);
    case "delete":
      return deleteItem(formData);
    default:
      return data({ error: "Invalid intent" }, { status: 400 });
  }
}

// In component:
<Form method="post">
  <input type="hidden" name="intent" value="create" />
  {/* ... */}
</Form>
```

### JSON Submissions

```tsx
export async function action({ request }: Route.ActionArgs) {
  const json = await request.json();
  // Process JSON body
  return { success: true };
}

// Client-side:
fetcher.submit(JSON.stringify(data), {
  method: "POST",
  encType: "application/json",
});
```

## Client Loaders & Actions

### clientLoader for Caching

```tsx
export async function clientLoader({ params, serverLoader }: Route.ClientLoaderArgs) {
  // Check cache first
  const cached = sessionStorage.getItem(`product-${params.id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fall back to server
  const data = await serverLoader();
  sessionStorage.setItem(`product-${params.id}`, JSON.stringify(data));
  return data;
}

// IMPORTANT: hydrate must use 'as const' for proper type inference
clientLoader.hydrate = true as const;
```

### clientLoader Modes

**hydrate = false (default)**: Server loader runs on initial load, clientLoader on subsequent navigations.

**hydrate = true**: clientLoader runs on initial hydration AND navigations. Shows HydrateFallback during hydration.

### clientAction for Optimistic UI

```tsx
export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  // Invalidate cache
  sessionStorage.removeItem("products");
  
  // Optimistically update UI state here if needed
  
  // Then call server
  return serverAction();
}
```

### Client-Only Routes (SPA Mode)

```tsx
// No server loader = client-only
export async function clientLoader() {
  const response = await fetch("/api/data");
  return response.json();
}

// HydrateFallback required for client-only routes
export function HydrateFallback() {
  return <Skeleton />;
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.value}</div>;
}
```

## Component Props

### Using Props vs Hooks

```tsx
// RECOMMENDED: Props approach (better type inference)
export default function Product({ 
  loaderData, 
  actionData, 
  params, 
  matches 
}: Route.ComponentProps) {
  const { product } = loaderData;
  return <div>{product.name}</div>;
}

// ALTERNATIVE: Hooks approach
import { useLoaderData, useActionData, useParams } from "react-router";

export default function Product() {
  const { product } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return <div>{product.name}</div>;
}
```

## Error Handling

### ErrorBoundary Export

```tsx
import { isRouteErrorResponse } from "react-router";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    // Thrown Response
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }
  
  // Thrown Error
  return (
    <div>
      <h1>Error</h1>
      <p>{error.message}</p>
    </div>
  );
}
```

### Throwing in Loaders/Actions

```tsx
export async function loader({ params }: Route.LoaderArgs) {
  const product = await db.product.findUnique({ where: { id: params.id } });
  
  // Throw Response for expected errors
  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }
  
  // Throw Error for unexpected errors (will be caught by ErrorBoundary)
  if (!product.isPublished) {
    throw new Error("Product not available");
  }
  
  return { product };
}
```

## Revalidation

### shouldRevalidate Function

```tsx
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formAction,
  formMethod,
  actionResult,
  actionStatus,
  defaultShouldRevalidate,
}: Route.ShouldRevalidateArgs) {
  // Skip revalidation for search param changes that don't affect data
  if (currentUrl.pathname === nextUrl.pathname) {
    const currentSort = currentUrl.searchParams.get("sort");
    const nextSort = nextUrl.searchParams.get("sort");
    if (currentSort === nextSort) {
      return false;
    }
  }
  
  // Use default for everything else
  return defaultShouldRevalidate;
}
```

### Common shouldRevalidate Patterns

```tsx
// Never revalidate (static data)
export function shouldRevalidate() {
  return false;
}

// Only revalidate after specific actions
export function shouldRevalidate({ formAction }) {
  return formAction ? ["/cart/add", "/cart/remove"].includes(formAction) : false;
}

// Only after mutations, not navigations
export function shouldRevalidate({ formMethod }) {
  return formMethod && formMethod !== "GET";
}

// Skip on error responses
export function shouldRevalidate({ actionStatus, defaultShouldRevalidate }) {
  if (actionStatus && actionStatus >= 400) return false;
  return defaultShouldRevalidate;
}
```

### unstable_defaultShouldRevalidate (v7.11+)

```tsx
// Call-site revalidation opt-out
navigate("/page", { 
  unstable_defaultShouldRevalidate: false 
});

fetcher.submit(formData, { 
  unstable_defaultShouldRevalidate: false 
});
```

## Other Exports

### headers

```tsx
export function headers({ loaderHeaders, parentHeaders }: Route.HeadersArgs) {
  return {
    "Cache-Control": loaderHeaders.get("Cache-Control") || "max-age=300",
    "X-Custom": "value",
  };
}
```

### handle

```tsx
// Attach arbitrary data to routes
export const handle = {
  breadcrumb: "Products",
  i18nKey: "products.page",
};

// Access via useMatches
const matches = useMatches();
const breadcrumbs = matches
  .filter(m => m.handle?.breadcrumb)
  .map(m => m.handle.breadcrumb);
```

### links

```tsx
export function links() {
  return [
    { rel: "stylesheet", href: "/styles/product.css" },
    { rel: "preload", href: "/images/hero.png", as: "image" },
  ];
}
```

### meta

```tsx
export function meta({ data, params }: Route.MetaArgs) {
  return [
    { title: data.product.name },
    { name: "description", content: data.product.description },
    { property: "og:title", content: data.product.name },
  ];
}
```
