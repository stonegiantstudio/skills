# Type Safety Reference

## Table of Contents

- [Setup](#setup)
- [Generated Types](#generated-types)
- [Route Type Helper](#route-type-helper)
- [AppLoadContext](#apploadcontext)
- [Common Issues](#common-issues)
- [Monorepo Considerations](#monorepo-considerations)

## Setup

### tsconfig.json Configuration

```json
{
  "include": [
    ".react-router/types/**/*",
    "app/**/*"
  ],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"],
    "moduleResolution": "bundler",
    "strict": true,
    "types": ["vite/client"]
  }
}
```

### .gitignore

```
.react-router/
```

### Type Generation

**Automatic**: Types generate when running `react-router dev` or when Vite dev server is active.

**Manual**:

```bash
react-router typegen
```

**In package.json**:

```json
{
  "scripts": {
    "typecheck": "react-router typegen && tsc --noEmit"
  }
}
```

## Generated Types

Types are generated to `.react-router/types/app/routes/+types/<route>.d.ts`.

### Import Pattern

```tsx
// For routes/products/$id.tsx
import type { Route } from "./+types/products.$id";

// The import path is relative - TypeScript resolves via rootDirs
```

### What's Generated

```ts
// .react-router/types/app/routes/+types/product.d.ts
import type * as T from "react-router/route-module";

export namespace Route {
  export type LoaderArgs = T.LoaderArgs<{
    params: { id: string }; // Inferred from route path
  }>;
  
  export type ActionArgs = T.ActionArgs<{
    params: { id: string };
  }>;
  
  export type ComponentProps = T.ComponentProps<{
    loaderData: Awaited<ReturnType<typeof loader>>;
    actionData: Awaited<ReturnType<typeof action>> | undefined;
    params: { id: string };
  }>;
  
  // ... other types
}
```

## Route Type Helper

### Complete Usage

```tsx
import type { Route } from "./+types/product";

// Loader with typed args
export async function loader({ params, request, context }: Route.LoaderArgs) {
  // params.id is typed as string
  return { product: await getProduct(params.id) };
}

// Action with typed args
export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  return { success: true };
}

// Client loader with server loader access
export async function clientLoader({ 
  params, 
  serverLoader 
}: Route.ClientLoaderArgs) {
  return serverLoader();
}
clientLoader.hydrate = true as const;

// Component with all props typed
export default function Product({
  loaderData,  // { product: Product }
  actionData,  // { success: boolean } | undefined
  params,      // { id: string }
  matches,     // RouteMatch[]
}: Route.ComponentProps) {
  return <div>{loaderData.product.name}</div>;
}

// Error boundary with typed error
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <div>Error: {error.message}</div>;
}

// Meta with typed data access
export function meta({ data, params }: Route.MetaArgs) {
  return [{ title: data?.product?.name ?? "Product" }];
}

// shouldRevalidate with typed args
export function shouldRevalidate(args: Route.ShouldRevalidateArgs) {
  return args.defaultShouldRevalidate;
}
```

### Using `as const` for clientLoader.hydrate

```tsx
// WRONG - TypeScript infers boolean
clientLoader.hydrate = true;

// CORRECT - TypeScript infers literal true
clientLoader.hydrate = true as const;
```

This matters because React Router derives `loaderData` types based on whether `hydrate` is exactly `true` or `false`.

## AppLoadContext

### Typing Global Context

```ts
// app/env.d.ts or app/types.d.ts
import "react-router";

declare module "react-router" {
  interface AppLoadContext {
    db: Database;
    user: User | null;
    requestId: string;
  }
}
```

### Usage in Loaders

```tsx
export async function loader({ context }: Route.LoaderArgs) {
  // context is now typed with your interface
  const products = await context.db.product.findMany();
  return { products, user: context.user };
}
```

### With Middleware Context Map

```ts
// When using middleware, context is a Map
declare module "react-router" {
  interface AppLoadContext extends Map<unknown, unknown> {
    get(key: "user"): User | undefined;
    get(key: "db"): Database | undefined;
  }
}
```

## Common Issues

### "Cannot find module './+types/...'"

**Cause**: Types not generated or tsconfig not configured.

**Fix**:

1. Ensure dev server is running, OR run `react-router typegen`
2. Verify `rootDirs` and `include` in tsconfig.json
3. Check `.react-router/types/` directory exists

### Loader Return Type Not Inferred

**Cause**: Using explicit return type instead of inference.

```tsx
// BAD - loses inference
export async function loader(): Promise<{ product: Product }> {
  return { product };
}

// GOOD - inference works
export async function loader({ params }: Route.LoaderArgs) {
  return { product: await getProduct(params.id) };
}
```

### actionData Always undefined

**Cause**: Action throws redirect instead of returning.

```tsx
// actionData will be undefined
export async function action() {
  await doSomething();
  throw redirect("/success"); // throws, doesn't return
}

// actionData will have value
export async function action() {
  await doSomething();
  return { success: true }; // returns before potential redirect
}
```

### useLoaderData Type Mismatch

```tsx
// If using hooks instead of props
import { useLoaderData } from "react-router";

// Option 1: Import loader type
import type { loader } from "./route";
const data = useLoaderData<typeof loader>();

// Option 2: Use Route helper
import type { Route } from "./+types/route";
const data = useLoaderData() as Route.ComponentProps["loaderData"];
```

### Type Import Style

```tsx
// RECOMMENDED - separate type import
import type { Route } from "./+types/product";

// Helps bundlers detect type-only imports
```

## Monorepo Considerations

### Known Issues

- Types generated outside `.react-router` when routes imported from external packages
- `rootDirs` relative imports don't work across package boundaries
- remix-flat-routes generates incompatible import paths

### Workarounds

**Subpath Imports**:

```json
// package.json
{
  "imports": {
    "#react-router/*": "./.react-router/types/*"
  }
}
```

**Script to Fix Paths**:

```ts
// scripts/fix-types.ts
import { glob } from "glob";
import { readFile, writeFile } from "fs/promises";

const files = await glob(".react-router/types/**/*.d.ts");
for (const file of files) {
  let content = await readFile(file, "utf-8");
  content = content.replace(
    /from "\.\.\/([^"]+)"/g,
    'from "#app/$1"'
  );
  await writeFile(file, content);
}
```

### Multi-tsconfig Setup

If using separate tsconfigs for different parts of your monorepo:

```json
// tsconfig.app.json (the one with your routes)
{
  "extends": "./tsconfig.base.json",
  "include": [".react-router/types/**/*", "app/**/*"],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"]
  }
}
```

### Disabling Auto-Generation

The Vite plugin auto-generates types. To disable:

```ts
// vite.config.ts
import { reactRouter } from "@react-router/dev/vite";

export default {
  plugins: [
    reactRouter({
      // No direct option to disable, but you can:
      // 1. Manually generate with `react-router typegen`
      // 2. Or handle in CI only
    })
  ]
};
```
