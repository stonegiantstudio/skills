# Middleware Reference

## Table of Contents

- [Overview](#overview)
- [Server Middleware](#server-middleware)
- [Client Middleware](#client-middleware)
- [Context API](#context-api)
- [Common Patterns](#common-patterns)

## Overview

Middleware runs sequentially before and after route handlers. Enable via config:

```ts
// react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_middleware: true, // Required - breaking change to getLoadContext
  },
} satisfies Config;
```

**Execution Order** (GET /parent/child):

1. Root middleware start
2. Parent middleware start  
3. Child middleware start
4. Run loaders, generate Response
5. Child middleware end
6. Parent middleware end
7. Root middleware end

## Server Middleware

### Basic Pattern

```tsx
import type { Route } from "./+types/route";

export const middleware: Route.Middleware = async ({ request, context }, next) => {
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
  
  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;
  
  console.log(`Completed in ${duration}ms`);
  return response;
};
```

### Authentication Middleware

```tsx
import { redirect } from "react-router";

export const middleware: Route.Middleware = async ({ request, context }, next) => {
  const session = await getSession(request);
  
  if (!session.userId) {
    throw redirect("/login");
  }
  
  // Add user to context for loaders/actions
  const user = await db.user.findUnique({ where: { id: session.userId } });
  context.set("user", user);
  
  return next();
};
```

### Modifying Responses

```tsx
export const middleware: Route.Middleware = async (args, next) => {
  const response = await next();
  
  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  return response;
};
```

## Client Middleware

Client middleware runs in the browser during client-side navigations.

```tsx
export const clientMiddleware: Route.ClientMiddleware = async ({ context }, next) => {
  // Track page views
  analytics.track("pageview");
  
  await next();
};
```

**Key differences from server middleware:**

- No Request/Response objects (not HTTP)
- Cannot throw redirect Responses (use `navigate()` instead)
- Runs on all client navigations, not just data requests

## Context API

### Server Context Setup

```ts
// vite.config.ts or server entry
export function getLoadContext(req: Request): Map<unknown, unknown> {
  const context = new Map();
  context.set("requestId", crypto.randomUUID());
  return context;
}
```

### Using Context

```tsx
// Middleware sets context
export const middleware: Route.Middleware = async ({ context }, next) => {
  context.set("startTime", Date.now());
  return next();
};

// Loader reads context
export async function loader({ context }: Route.LoaderArgs) {
  const startTime = context.get("startTime");
  const user = context.get("user");
  return { user };
}
```

### Typed Context

```ts
// app/context.ts
import { createContext } from "react-router";

export const userContext = createContext<User>("user");
export const dbContext = createContext<Database>("db");

// In middleware
context.set(userContext, user);

// In loader (typed!)
const user = context.get(userContext);
```

### AsyncLocalStorage with RSC

```tsx
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage<{ user: User }>();

export const middleware: Route.Middleware = async ({ context }, next) => {
  const user = context.get("user");
  
  return requestContext.run({ user }, () => next());
};

// In Server Components - access without prop drilling!
export function ServerComponent() {
  const { user } = requestContext.getStore()!;
  return <div>Hello {user.name}</div>;
}
```

## Common Patterns

### Logging Middleware

```tsx
export const middleware: Route.Middleware = async ({ request }, next) => {
  const url = new URL(request.url);
  const id = crypto.randomUUID().slice(0, 8);
  
  console.log(`[${id}] → ${request.method} ${url.pathname}`);
  
  try {
    const response = await next();
    console.log(`[${id}] ← ${response.status}`);
    return response;
  } catch (error) {
    console.error(`[${id}] ✗ Error:`, error);
    throw error;
  }
};
```

### Rate Limiting

```tsx
const rateLimiter = new Map<string, number[]>();

export const middleware: Route.Middleware = async ({ request }, next) => {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;
  
  const timestamps = rateLimiter.get(ip) || [];
  const recentTimestamps = timestamps.filter(t => t > now - windowMs);
  
  if (recentTimestamps.length >= maxRequests) {
    throw new Response("Too Many Requests", { status: 429 });
  }
  
  recentTimestamps.push(now);
  rateLimiter.set(ip, recentTimestamps);
  
  return next();
};
```

### CORS Handling

```tsx
export const middleware: Route.Middleware = async ({ request }, next) => {
  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
  
  const response = await next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
};
```

### Error Handling Wrapper

```tsx
export const middleware: Route.Middleware = async (args, next) => {
  try {
    return await next();
  } catch (error) {
    // Log to error service
    await errorReporter.capture(error, {
      url: args.request.url,
      method: args.request.method,
    });
    
    // Re-throw to let error boundaries handle
    throw error;
  }
};
```

### Timing Headers

```tsx
export const middleware: Route.Middleware = async (args, next) => {
  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;
  
  response.headers.set("Server-Timing", `total;dur=${duration.toFixed(2)}`);
  return response;
};
```

## Middleware in Data Mode

For non-Framework Mode (Data Mode with createBrowserRouter):

```tsx
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    middleware: [loggingMiddleware, authMiddleware],
    loader: rootLoader,
    Component: Root,
    children: [
      {
        path: "dashboard",
        middleware: [adminMiddleware],
        loader: dashboardLoader,
        Component: Dashboard,
      }
    ]
  }
]);
```
