---
description: Better Auth integration expertise for TypeScript authentication. Triggers when implementing auth flows, configuring OAuth providers, setting up sessions, email verification, password reset, or any file importing from better-auth. Use for auth configuration, plugin setup, database adapters, session management, hooks, and security best practices.
---

# Better Auth

Better Auth is a TypeScript-first, framework-agnostic authentication framework. Comprehensive, extensible, battle-tested.

**Always consult [better-auth.com/docs](https://better-auth.com/docs) for latest API and examples.**

## Decision Tree

```text
Is this a new/empty project?
├─ YES → New project setup
│   1. Identify framework (React Router, Next.js, etc.)
│   2. Choose database adapter
│   3. Install better-auth + scoped packages
│   4. Create auth.server.ts + auth.client.ts
│   5. Set up route handler
│   6. Run CLI migrate/generate
│   7. Add features via plugins
│
└─ NO → Does project have existing auth?
    ├─ YES → Migration
    │   • Audit current auth for gaps
    │   • Plan incremental migration
    │   • See migration guides: Auth0, Clerk, Auth.js, Supabase
    │
    └─ NO → Add auth to existing project
        1. Analyze project structure
        2. Install better-auth
        3. Create auth config files
        4. Add route handler
        5. Run schema migrations
        6. Integrate into existing pages
```

## Quick Reference

### Installation

Use the project's package manager (detect from lock file).

```bash
# Core package
<pkg> add better-auth

# Scoped packages (as needed)
<pkg> add @better-auth/passkey    # WebAuthn/Passkey
<pkg> add @better-auth/sso        # SAML/OIDC enterprise SSO
<pkg> add @better-auth/stripe     # Stripe payments
<pkg> add @better-auth/expo       # React Native/Expo

# Generate/apply schema (use bunx for bun, npx for others)
npx @better-auth/cli@latest migrate    # Built-in adapter
npx @better-auth/cli@latest generate   # Prisma/Drizzle
```

**Re-run CLI after adding/changing plugins.**

### Environment Variables

```bash
BETTER_AUTH_SECRET=   # Min 32 chars. Generate: openssl rand -base64 32
BETTER_AUTH_URL=      # Base URL: https://example.com
```

Only set `baseURL`/`secret` in config if env vars are NOT set.

### Core Config Options

| Option | Notes |
|--------|-------|
| `database` | Required. pg.Pool, mysql2, sqlite, or ORM adapter |
| `emailAndPassword` | `{ enabled: true }` to activate |
| `socialProviders` | `{ google: { clientId, clientSecret }, ... }` |
| `plugins` | Array of plugins |
| `session` | Expiry, cookie cache settings |
| `secondaryStorage` | Redis/KV for sessions & rate limits |
| `trustedOrigins` | CSRF whitelist |
| `basePath` | Default `/api/auth`. Set `/` for root |

## Server Config

```typescript
// lib/auth.server.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: pool, // pg.Pool, mysql2, better-sqlite3, or ORM adapter

  emailAndPassword: { enabled: true },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  plugins: [
    // Import from dedicated paths for tree-shaking
    // import { twoFactor } from "better-auth/plugins/two-factor"
  ],
});

// Type inference
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

## Client Setup

```typescript
// lib/auth.client.ts
import { createAuthClient } from "better-auth/react"; // or /client, /vue, /svelte, /solid

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_APP_URL, // Optional if same origin
  plugins: [], // Client-side plugins must match server
});

// Type-safe client for separate projects
// createAuthClient<typeof auth>()
```

## Route Handler by Framework

| Framework | File | Handler |
|-----------|------|---------|
| React Router v7 | `app/routes/api.auth.$.ts` | `auth.handler(request)` |
| Next.js App Router | `app/api/auth/[...all]/route.ts` | `toNextJsHandler(auth)` |
| Next.js Pages | `pages/api/auth/[...all].ts` | `toNextJsHandler(auth)` |
| SvelteKit | `src/hooks.server.ts` | `svelteKitHandler(auth)` |
| SolidStart | Route file | `solidStartHandler(auth)` |
| Hono | Route file | `auth.handler(c.req.raw)` |
| Express | Any file | `app.all("/api/auth/*", toNodeHandler(auth))` |

### React Router v7 Integration

```typescript
// app/routes/api.auth.$.ts - Catch-all auth route
import { auth } from "~/lib/auth.server";
import type { Route } from "./+types/api.auth.$";

export async function loader({ request }: Route.LoaderArgs) {
  return auth.handler(request);
}

export async function action({ request }: Route.ActionArgs) {
  return auth.handler(request);
}
```

```typescript
// app/routes/_protected.tsx - Layout with auth guard
import { redirect } from "react-router";
import { auth } from "~/lib/auth.server";
import type { Route } from "./+types/_protected";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/login");
  return { user: session.user };
}

export default function ProtectedLayout({ loaderData }: Route.ComponentProps) {
  return <Outlet context={{ user: loaderData.user }} />;
}
```

```typescript
// app/routes/login.tsx - Client-side auth
import { authClient } from "~/lib/auth.client";

export default function Login() {
  const handleGoogleLogin = () => {
    authClient.signIn.social({ provider: "google" });
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await authClient.signIn.email({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>Sign in with Google</button>
      <form onSubmit={handleEmailLogin}>
        <input name="email" type="email" required />
        <input name="password" type="password" required />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
```

## Database Adapters

| Database | Setup |
|----------|-------|
| PostgreSQL | `new Pool({ connectionString })` directly |
| MySQL | `mysql2` pool directly |
| SQLite | `better-sqlite3` or `bun:sqlite` instance |
| Drizzle | `drizzleAdapter(db, { provider: "pg" })` |
| Prisma | `prismaAdapter(prisma, { provider: "postgresql" })` |
| MongoDB | `mongodbAdapter(client.db("mydb"))` |

**Critical:** Use ORM model names, NOT table names. If Prisma model is `User` mapping to `users` table, use `modelName: "user"`.

## Session Management

**Storage priority:**

1. If `secondaryStorage` defined → sessions go there (not DB)
2. Set `session.storeSessionInDatabase: true` to also persist to DB
3. No database + `cookieCache` → fully stateless mode

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days (seconds)
  updateAge: 60 * 60 * 24,     // Refresh after 1 day

  cookieCache: {
    enabled: true,
    strategy: "compact", // "compact" | "jwt" | "jwe"
    maxAge: 60 * 5,      // 5 minutes
    version: 1,          // Change to invalidate all sessions
  },

  storeSessionInDatabase: true, // Required if using secondaryStorage
}
```

**Cookie cache strategies:**

- `compact` (default) - Base64url + HMAC. Smallest size.
- `jwt` - Standard JWT. Readable but signed.
- `jwe` - Encrypted. Maximum security.

## Email Configuration

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url }) => {
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `<a href="${url}">Reset password</a>`,
    });
  },
},

emailVerification: {
  sendOnSignUp: true,
  sendVerificationEmail: async ({ user, url }) => {
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<a href="${url}">Verify email</a>`,
    });
  },
},
```

## Hooks

```typescript
// Endpoint hooks (before/after HTTP handlers)
hooks: {
  before: [
    {
      matcher: (ctx) => ctx.path.startsWith("/api/auth"),
      handler: createAuthMiddleware(async (ctx) => {
        console.log("Auth request:", ctx.path);
        return { context: ctx.context }; // Continue
      }),
    },
  ],
  after: [
    {
      matcher: (ctx) => ctx.path === "/api/auth/sign-up",
      handler: createAuthMiddleware(async (ctx) => {
        if (ctx.context.returned) {
          await trackSignUp(ctx.context.returned.user);
        }
      }),
    },
  ],
},

// Database hooks
databaseHooks: {
  user: {
    create: {
      before: async (user) => {
        return { data: { ...user, role: "member" } };
      },
      after: async (user) => {
        await createDefaultWorkspace(user.id);
      },
    },
  },
},
```

**Hook context (`ctx.context`):** `session`, `secret`, `authCookies`, `password.hash()`/`verify()`, `adapter`, `internalAdapter`, `generateId()`, `tables`, `baseURL`.

## Plugins

**Import from dedicated paths for tree-shaking:**

```typescript
import { twoFactor } from "better-auth/plugins/two-factor";
// NOT: import { twoFactor } from "better-auth/plugins"
```

| Plugin | Server Import | Client Import | Purpose |
|--------|---------------|---------------|---------|
| `twoFactor` | `better-auth/plugins/two-factor` | `twoFactorClient` | 2FA with TOTP/OTP |
| `organization` | `better-auth/plugins/organization` | `organizationClient` | Teams/orgs |
| `admin` | `better-auth/plugins/admin` | `adminClient` | User management |
| `passkey` | `@better-auth/passkey` | `passkeyClient` | WebAuthn |
| `magicLink` | `better-auth/plugins/magic-link` | `magicLinkClient` | Passwordless |
| `bearer` | `better-auth/plugins/bearer` | - | API token auth |
| `jwt` | `better-auth/plugins/jwt` | - | JWT tokens |
| `sso` | `@better-auth/sso` | - | Enterprise SSO |
| `openAPI` | `better-auth/plugins/open-api` | - | API docs |

**Plugin pattern:** Server plugin + client plugin + run migrations.

## Security Options

```typescript
advanced: {
  useSecureCookies: true,        // Force HTTPS cookies
  crossSubDomainCookies: {
    enabled: true,
    domain: ".example.com",
  },
  ipAddress: {
    ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
  },
  database: {
    generateId: "uuid",          // "uuid" | "serial" | false | () => string
  },
},

rateLimit: {
  enabled: true,
  window: 60,                    // Seconds
  max: 10,                       // Requests per window
  storage: "secondary-storage",  // "memory" | "database" | "secondary-storage"
},

trustedOrigins: ["https://app.example.com"],
```

## Security Checklist

- [ ] `BETTER_AUTH_SECRET` set (32+ chars, generated securely)
- [ ] `advanced.useSecureCookies: true` in production
- [ ] `trustedOrigins` configured for all valid domains
- [ ] Rate limits enabled (`rateLimit.enabled: true`)
- [ ] Email verification enabled for email/password auth
- [ ] Password reset flow implemented with `sendResetPassword`
- [ ] 2FA enabled for sensitive applications
- [ ] CSRF protection NOT disabled (`disableCSRFCheck` is false)
- [ ] `account.accountLinking` settings reviewed
- [ ] OAuth redirect URIs verified in provider dashboards

## Client Methods Reference

```typescript
// Sign up/in
authClient.signUp.email({ email, password, name });
authClient.signIn.email({ email, password });
authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });

// Session
const session = authClient.useSession(); // React hook: { data, isPending }
const session = await authClient.getSession();

// Sign out
await authClient.signOut();

// Session management
await authClient.revokeSession({ sessionId });
await authClient.revokeSessions(); // All other sessions
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Secret not set" | Missing env var | Add `BETTER_AUTH_SECRET` to environment |
| "Invalid Origin" | CSRF protection | Add domain to `trustedOrigins` array |
| Sessions not persisting | `secondaryStorage` defined | Sessions go to Redis by default. Set `storeSessionInDatabase: true` |
| Cookies not setting | Domain mismatch | Check `baseURL` matches domain; enable secure cookies in prod |
| Custom fields missing | Cookie cache limit | Custom session fields always re-fetch from DB |
| Plugin schema missing | CLI not re-run | Run `npx @better-auth/cli migrate` after adding plugins |
| Model not found | Table vs model name | Use ORM model name, not DB table name |
| Email verification failing | No handler | Must define `sendVerificationEmail` function |
| Logout not working | Stateless mode | No DB = session in cookie only, clears on cache expiry |
| OAuth callback errors | Redirect URI | Verify redirect URIs in provider dashboard |
| Type errors after plugin | Schema outdated | Re-run CLI generate/migrate |
| Change email confusing | Two-step flow | Sends to current email first, then new email |

## Resources

- [Documentation](https://better-auth.com/docs)
- [Options Reference](https://better-auth.com/docs/reference/options)
- [GitHub](https://github.com/better-auth/better-auth)
- [LLMs.txt](https://better-auth.com/llms.txt)
- [Examples](https://github.com/better-auth/examples)
- [Migration Guides](https://better-auth.com/docs/guides) (Auth0, Clerk, Auth.js, Supabase)
