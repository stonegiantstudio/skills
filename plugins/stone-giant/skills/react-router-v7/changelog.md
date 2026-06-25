# Changelog & Known Issues

Last updated: January 2026

## Table of Contents

- [v7.11.0-v7.12.0 Changes](#v7110-v7120-changes)
- [Security CVEs](#security-cves)
- [Breaking Changes](#breaking-changes)
- [Unstable Features](#unstable-features)
- [Bug Fixes](#bug-fixes)
- [Known Issues](#known-issues)

## v7.11.0-v7.12.0 Changes

### New Features

#### Vite Preview Support

```bash
# Preview production build locally in Framework mode
vite preview
```

#### Stabilized onError API

```tsx
// OLD (unstable)
<RouterProvider unstable_onError={handleError} />

// NEW (stable)
<RouterProvider onError={handleError} />
<HydratedRouter onError={handleError} />
```

See Error Reporting docs for details.

#### Enhanced CSRF Protection

Submissions to UI routes from external origins are now rejected by default.

```ts
// react-router.config.ts
export default {
  // Allow specific external origins to submit to actions
  allowedActionOrigins: [
    "https://trusted-domain.com",
    "https://partner-site.com"
  ],
} satisfies Config;
```

### Experimental Features in v7.11-7.12

#### Call-site Revalidation Opt-out

```tsx
// Skip revalidation for this specific navigation
navigate("/page", {
  unstable_defaultShouldRevalidate: false
});

// Skip revalidation for this fetcher submission
fetcher.submit(data, {
  unstable_defaultShouldRevalidate: false
});

// Works with useSubmit too
submit(data, {
  unstable_defaultShouldRevalidate: false
});
```

The flag is passed to `shouldRevalidate` functions for final control.

#### RSC Improvements

- `data()` and `Response` can be thrown from server component render phase
- Redirect Responses can be thrown at render time
- `routeRSCServerRequest` API updates
- Manual chunking for react and react-router dependencies
- Custom entrypoints support in Framework mode

## Security CVEs

Update immediately to v7.12.0+ (or v6.30.3+ / Remix v2.17.2+):

| CVE                      | Description                                        |
| ------------------------ | -------------------------------------------------- |
| XSS via Meta component   | script:ld+json tags vulnerable                     |
| Unauthorized file access | createFileSessionStorage() with unsigned cookies   |
| External redirect        | Untrusted paths could redirect externally          |
| CSRF                     | Action/Server Action request processing            |
| XSS via Open Redirects   | Redirect handling vulnerability                    |
| SSR XSS                  | ScrollRestoration component                        |

## Breaking Changes

### v7 from v6

- Import from `"react-router"` not `"react-router-dom"`
- `json()` and `defer()` deprecated - return raw objects
- Fetcher lifecycle based on idle state, not component unmount
- `RouterProvider` DOM exports from `"react-router/dom"`

### Middleware Breaking Change (v8_middleware flag)

When enabled, `getLoadContext` must return a `Map`:

```ts
// OLD
export function getLoadContext() {
  return { db, user };
}

// NEW (with v8_middleware)
export function getLoadContext() {
  const context = new Map();
  context.set("db", db);
  context.set("user", user);
  return context;
}
```

## Bug Fixes

### v7.11-7.12 Notable Fixes

- `unstable_useTransitions` prop on `<Router>` permits omission for backwards compatibility
- Redirects can be returned from client-side middleware
- `dataStrategy` handles insufficient result sets with proper errors
- `generatePath` fixed for suffixed params (e.g., `/books/:id.json`)
- HTML escaped in scroll restoration keys
- Redirect locations validated
- `clientLoader.hydrate=true` preserved with `<HydratedRouter unstable_instrumentations>`
- Maximum call stack exceeded errors fixed for HMR with cyclic imports
- SSR middleware skipped in vite preview for SPA mode
- `<Scripts nonce>` passed to importmap script tags with SRI

### Dependency Updates

- compression and morgan updated for on-headers CVE

## Unstable Features

### Current Unstable APIs

| Feature                   | Flag/API                                          | Status             |
| ------------------------- | ------------------------------------------------- | ------------------ |
| Middleware                | `future.v8_middleware`                            | Stabilizing in v8  |
| Trailing slash handling   | `future.unstable_trailingSlashAwareDataRequests`  | Testing            |
| Sub-resource integrity    | `future.unstable_subResourceIntegrity`            | Testing            |
| Default should revalidate | `unstable_defaultShouldRevalidate`                | Testing            |
| RSC                       | `future.unstable_rsc`                             | Active development |

### Exported for Migration

```tsx
import {
  UNSAFE_createMemoryHistory,
  UNSAFE_createHashHistory
} from "react-router";
```

## Known Issues

### Typegen Issues

#### Monorepo/External Routes

Types generated outside `.react-router` when routes imported from external packages. Workaround: Keep route files in main app directory.

#### remix-flat-routes Incompatibility

Generated types have invalid import paths. Use fs-routes or manual routes.ts instead.

#### rootDirs in Consuming Packages

Generated relative imports don't resolve across package boundaries. Workaround: Post-process types with absolute imports.

### Framework Mode Issues

#### SPA Mode + Middleware

SSR middleware skipped in vite preview for SPA mode - by design, but can be confusing.

#### HMR with Cyclic Imports

Stack overflow errors fixed in v7.12, but cyclic imports should still be avoided.

### Data Mode Issues

#### route.lazy() with Middleware

Original `route.lazy()` function signature doesn't support middleware efficiently. Use new granular lazy API:

```tsx
// OLD - waits for all lazy to resolve before middleware
lazy: () => import("./route")

// NEW - granular control
lazy: {
  unstable_middleware: async () => (await import("./middleware")).middleware,
  loader: async () => (await import("./loader")).loader,
  Component: async () => (await import("./component")).Component,
}
```

### Action/Loader Issues

#### undefined Return Values

Returning `undefined` from loaders now allowed, but can cause hydration issues with custom SSR setups using `context.loaderData`.

#### Single Fetch Revalidation

Default behavior changed - loaders always revalidate. Add `shouldRevalidate` to opt-out:

```tsx
export function shouldRevalidate() {
  return false;
}
```

### RSC Known Limitations (Unstable)

- Errors in routes not forced to revalidate when `shouldRevalidate` returns false
- "Matched leaf route does not have element/Component" warnings with error boundaries
- Limited documentation - API still evolving

## Upgrade Checklist

When upgrading from v6 to v7:

- [ ] Update imports from `react-router-dom` to `react-router`
- [ ] Replace `json()` with raw object returns
- [ ] Replace `defer()` with raw promise returns
- [ ] Update `RouterProvider` import to `react-router/dom` if using DOM
- [ ] Check fetcher usage (lifecycle changed)
- [ ] Run `react-router typegen` and fix type imports
- [ ] Update tsconfig.json with rootDirs
- [ ] Review `shouldRevalidate` needs (revalidation more aggressive)
- [ ] Check for deprecated `unstable_` APIs that are now stable
