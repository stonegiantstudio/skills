---
name: resend
description: Resend email API expertise for transactional emails, notifications, and batch sends. Triggers when sending emails, implementing email notifications, password resets, order confirmations, or any file importing from resend. Use for email sending, webhooks, templates, deliverability, and error handling.
metadata:
  upstream:
    repo: resend/resend-skills
    lastChecked: "2025-01-30"
    checkInterval: weekly
---

# Resend Email API

Resend is the email API for developers. TypeScript-first, excellent DX.

**Always consult [resend.com/docs](https://resend.com/docs) for latest API.**

> **Upstream:** Based on [resend/resend-skills](https://github.com/resend/resend-skills). Check weekly for updates.

## Quick Start

```bash
# Install
<pkg> add resend

# Environment
RESEND_API_KEY=re_xxxxxxxxx  # Get from resend.com/api-keys
```

## Decision: Single vs Batch

| Approach | Endpoint | Use Case |
|----------|----------|----------|
| **Single** | `POST /emails` | Individual emails, attachments, scheduled sends |
| **Batch** | `POST /emails/batch` | 2-100 distinct emails, reduce API calls |

**Choose batch when:** 2+ emails, no attachments, no scheduling, reducing API calls matters (rate limit: 2 req/sec default)

**Choose single when:** One email, needs attachments, needs scheduling, different timing per recipient

## Single Email

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// With idempotency key (always use in production)
const { data, error } = await resend.emails.send(
  {
    from: "Acme <notifications@acme.com>",
    to: ["user@example.com"],
    subject: "Welcome to Acme",
    html: "<p>Thanks for signing up!</p>",
  },
  { idempotencyKey: `welcome-email/${userId}` }
);

if (error) {
  console.error("Failed:", error.message);
  return;
}
console.log("Sent:", data.id);
```

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Sender: `"Name <email@domain.com>"` |
| `to` | string[] | Recipients (max 50) |
| `subject` | string | Subject line |
| `html` or `text` | string | Body content |

### Optional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cc` | string[] | CC recipients |
| `bcc` | string[] | BCC recipients |
| `replyTo` | string[] | Reply-to addresses |
| `scheduledAt` | string | ISO 8601 datetime |
| `attachments` | array | Files (max 40MB total) |
| `tags` | array | Key/value pairs for tracking |
| `headers` | object | Custom headers |

## Batch Email

```typescript
const { data, error } = await resend.batch.send(
  [
    {
      from: "Acme <notifications@acme.com>",
      to: ["user1@example.com"],
      subject: "Order Shipped",
      html: "<p>Your order has shipped!</p>",
    },
    {
      from: "Acme <notifications@acme.com>",
      to: ["user2@example.com"],
      subject: "Order Confirmed",
      html: "<p>Your order is confirmed!</p>",
    },
  ],
  { idempotencyKey: `batch-orders/${batchId}` }
);
```

**Limitations:**
- No attachments (use single sends)
- No scheduling (use single sends)
- Max 100 emails per request
- Atomic: one invalid email fails entire batch

### Large Batches (100+ Emails)

```typescript
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

const chunks = chunkArray(emails, 100);
const results = await Promise.all(
  chunks.map((chunk, index) =>
    resend.batch.send(chunk, {
      idempotencyKey: `batch-${batchId}/chunk-${index}`,
    })
  )
);
```

## React Router Integration

```typescript
// app/lib/email.server.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(user: { email: string; name: string }) {
  const { error } = await resend.emails.send(
    {
      from: "Acme <hello@acme.com>",
      to: [user.email],
      subject: "Welcome to Acme!",
      html: `<p>Hi ${user.name}, welcome aboard!</p>`,
    },
    { idempotencyKey: `welcome/${user.email}` }
  );

  if (error) {
    console.error("Email failed:", error);
    throw new Error("Failed to send welcome email");
  }
}
```

```typescript
// app/routes/signup.tsx
import { sendWelcomeEmail } from "~/lib/email.server";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const user = await createUser(formData);

  // Fire and forget (or await if critical)
  sendWelcomeEmail(user).catch(console.error);

  return redirect("/dashboard");
}
```

## Idempotency Keys

**Always use in production** - prevents duplicate sends on retry.

| Format | Example |
|--------|---------|
| Single | `<event-type>/<entity-id>` → `welcome-email/user-123` |
| Batch | `batch-<type>/<batch-id>` → `batch-orders/batch-456` |

- Expires after 24 hours
- Max 256 characters
- Same key + same payload = returns original response (no resend)
- Same key + different payload = 409 error

## Error Handling

| Code | Action |
|------|--------|
| 400, 422 | Fix request, don't retry |
| 401, 403 | Check API key / domain, don't retry |
| 409 | Idempotency conflict - new key or fix payload |
| 429 | Rate limited - exponential backoff |
| 500 | Server error - exponential backoff |

```typescript
async function sendWithRetry(
  emailFn: () => Promise<{ data: any; error: any }>,
  maxRetries = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await emailFn();

    if (!error) return { data, error: null };

    // Don't retry client errors
    if (error.statusCode && error.statusCode < 500 && error.statusCode !== 429) {
      return { data: null, error };
    }

    // Exponential backoff
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise((r) => setTimeout(r, delay));
  }

  return { data: null, error: new Error("Max retries exceeded") };
}
```

## Webhooks

Track delivery status in real-time.

| Event | Use Case |
|-------|----------|
| `email.delivered` | Confirm delivery |
| `email.bounced` | Remove from list, alert user |
| `email.complained` | Auto-unsubscribe (spam complaint) |
| `email.opened` | Track engagement (marketing only) |
| `email.clicked` | Track engagement (marketing only) |

**Always verify signatures:**

```typescript
import { Webhook } from "resend";

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);

  try {
    const event = webhook.verify(payload, headers);

    switch (event.type) {
      case "email.bounced":
        await handleBounce(event.data);
        break;
      case "email.complained":
        await handleComplaint(event.data);
        break;
    }

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }
}
```

## Templates

```typescript
const { data, error } = await resend.emails.send({
  from: "Acme <hello@acme.com>",
  to: ["user@example.com"],
  subject: "Welcome!",
  template: {
    id: "tmpl_abc123",
    variables: {
      USER_NAME: "John",      // Case-sensitive!
      ORDER_TOTAL: "$99.00",
    },
  },
});
```

**Important:**
- Variable names are **case-sensitive** (`USER_NAME` ≠ `user_name`)
- Max 20 variables per template
- Must be **published** in dashboard (drafts don't work)
- Can't combine with `html`, `text`, or `react` params

## Tags

```typescript
tags: [
  { name: "user_id", value: "usr_123" },
  { name: "email_type", value: "welcome" },
  { name: "plan", value: "enterprise" },
]
```

Use for: filtering in dashboard, correlating webhooks, analytics.

## Testing

**Never use fake addresses at real providers** (test@gmail.com destroys reputation).

| Address | Result |
|---------|--------|
| `delivered@resend.dev` | Simulates success |
| `bounced@resend.dev` | Simulates hard bounce |
| `complained@resend.dev` | Simulates spam complaint |

## Deliverability Checklist

**Required:**
- [ ] Valid SPF, DKIM, DMARC records
- [ ] Links match sending domain (send from @acme.com → link to acme.com)
- [ ] Include plain text version (or let Resend auto-generate)
- [ ] Avoid "no-reply" addresses (use support@, hello@)
- [ ] Body under 102KB (Gmail clips larger)

**Recommended:**
- [ ] Use subdomains (notifications.acme.com for transactional)
- [ ] Disable tracking for transactional emails (password resets, receipts)

## Domain Warm-up (New Domains)

| Day | Max Emails | Max/Hour |
|-----|------------|----------|
| 1 | 150 | - |
| 2 | 250 | - |
| 3 | 400 | - |
| 4 | 700 | 50 |
| 5 | 1,000 | 75 |
| 6 | 1,500 | 100 |
| 7 | 2,000 | 150 |

**Monitor:** Bounce rate < 4%, Spam complaints < 0.08%

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Retrying without idempotency key | Always include - prevents duplicates |
| Batch with attachments | Use single sends for attachments |
| Retrying 400/422 errors | Fix request, don't retry |
| Tracking on transactional | Disable for password resets, receipts |
| Using "no-reply" sender | Use real address (support@) |
| Not verifying webhook signatures | Always verify - security critical |
| Testing with fake emails | Use `@resend.dev` test addresses |
| High volume from new domain | Warm up gradually |

## Resources

- [Documentation](https://resend.com/docs)
- [API Reference](https://resend.com/docs/api-reference)
- [React Email](https://react.email) - Component library for emails
- [Official Skills](https://github.com/resend/resend-skills) - Upstream source
