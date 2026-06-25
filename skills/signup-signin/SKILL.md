---
name: signup-signin
description: Sign-up and sign-in UX as a design + copy discipline. Use when building or reviewing any auth surface — sign-up, sign-in, OTP, magic-link, passkey enrollment, forgot-password, recovery, or lockout. Owns the user-facing experience (copy, error states, recovery affordances, persona tests); defers integration mechanics to the relevant stack skill (`better-auth`, `resend`, `clerk`, etc.). See the "When to invoke" section for filename and import triggers.
---

# Sign-up and Sign-in

Auth is the most consequential UX surface in any app. A user who can't sign up never becomes a user. A user who can't recover their account becomes a support ticket and, eventually, a refund. A user who gets shamed by an error message remembers it.

This skill owns the **user-facing experience**: the layout, the copy, the recovery affordances, the trade-off decisions. Integration mechanics (SDK calls, plugin wiring, database schema, session cookies) live in stack-specific skills — invoke `better-auth`, `resend`, `clerk`, etc. for those.

The non-negotiable rule: **every auth surface must pass two persona tests at the same time.**

1. **Would I show this to a 14-year-old who just lost their phone?** Anxious, mobile-only, expects mobile-first recovery, low patience, quick to blame the site. Tests for: jargon, missing escape hatches, anxiety relief, copy that assumes a working phone.
2. **Would I show this to a 70-year-old who is uncomfortable with technology?** Fears breaking something irreversible, may not own a smartphone, expects to be guided slowly, needs a human on the other end if things go wrong. Tests for: jargon, small touch targets, copy density, single-channel dependencies, missing "real human" affordance.

If a screen, error, or email fails either test, it's a blocker. The two personas look opposite but converge on the same failures — auth that demands working memory, jargon literacy, or one specific channel breaks both.

---

## Three commitments

Every recommendation in this skill serves at least one. Most serve all three.

### Polite

Blame the form, never the user. `"That email and password don't match"` not `"You entered the wrong password."` Calm tone in errors, warm tone in successes — never the inverse. Humor in failure states reads as mockery. The user is already anxious; don't pile on.

Test: read the copy aloud. If it sounds like a system reporting at the user, rewrite. If it sounds like a person saying "here's what happened and what to do next," it's right.

### Safe

NIST SP 800-63B Rev. 4, OWASP ASVS V6, and WCAG 2.2 SC 3.3.8 are the floor. Beyond compliance: defend against the failure modes that actually destroy accounts — enumeration, SMS pumping, lost-second-factor lockout, social-engineered support. Recovery flows are login flows wearing a hat; they get the same rate limits, the same generic errors, the same scrutiny.

Test: imagine the worst plausible attacker (SIM-swap fraudster, scraper, kid trying to take over a classmate's account). What's the easiest path through this screen? Close it.

### Easy

Plain language at a 6th-grade reading level. One thing per screen during onboarding. Multiple recovery channels — never single-point-of-failure. WCAG-conformant touch targets, paste-friendly OTP, password-manager-friendly fields. The user's job is to use the product, not to negotiate with the auth flow.

Test: hand the screen to someone who has never used the product. Can they finish without asking what a word means or what to do next?

---

## The recovery floor

Every auth flow needs at least two of these recovery affordances. The first two are **required**; the third is **strongly recommended** but audience-dependent (see the trade-off below).

### Required

1. **Email recovery code, not magic link.** A 6-8 digit code the user can copy from one device and paste on another. Magic links break in three common environments: corporate email scanners that consume the token before the user clicks (Outlook safe-links, Mimecast), school WiFi blocking the magic-link domain, and cross-device flows (user clicked the email on phone, wants to sign in on the laptop they already had open). Codes survive all three.

2. **A published support contact.** A real human-reachable path for the worst case — phone permanently lost, email locked out, every other channel exhausted. If the product can't commit to a live human, the contact has to disclose the constraint honestly ("Email replies within 24 hours. We're a small team — we'll do our best") rather than imply a Zendesk that doesn't exist. Don't lie to users about the safety net.

### Strongly recommended (audience-dependent)

3. **Paper-printable backup codes**, regeneratable from any active session. NIST 800-63B-4 §3.1.2: lookup secrets ≥20 bits of entropy, one-time-use. The recovery value is total — printed codes survive a dead phone, a lost laptop, a flooded house.

   **But** the "save these somewhere safe" pattern fails both persona tests for audiences who don't have a "somewhere safe" outside their phone (most teens) or who don't recognize "backup codes" as a concept (many older users). For those audiences:

   - **Don't force show-once at first sign-in.** Offer backup codes as an opt-in affordance in profile/settings. The user who proactively wants the extra safety net can take it; the user for whom it's just one more chore doesn't get pushed off the funnel.
   - **For audiences where backup codes are familiar** (B2B SaaS, security-savvy users, regulated industries), the original "show once at MFA enrollment" pattern from Discord/Stripe still fits.

   Pick per project; the skill's job is to make the trade-off explicit, not to mandate one shape. If you ship without backup codes, the recovery story for "lost phone permanently + can't access email" depends on the published support contact — make sure response expectations are realistic.

---

## Persona-test procedure

Run on every error message, button label, callout, email body, and screen state. Not just the happy path.

For each string, fill in the table:

```text
| String                | 14-yr-old phone-lost | 70-yr-old low-tech    | Action  |
|-----------------------|----------------------|-----------------------|---------|
| <the actual copy>     | ✓ / ✗ + reason       | ✓ / ✗ + reason        | keep    |
|                       |                      |                       | rewrite |
```

Both must pass. One pass + one fail = rewrite. Worked examples:

| Original | 14-yr-old | 70-yr-old | Action |
|---|---|---|---|
| `"Invalid credentials."` | ✗ blames + jargon | ✗ jargon ("credentials") | Rewrite → `"That email and password don't match. Try again, or reset your password."` |
| `"Verification token expired. Re-initiate authentication."` | ✗ jargon | ✗ jargon | Rewrite → `"That code expired. We'll send a new one — check your phone."` |
| `"Check that your phone has signal, then tap Resend."` | ✗ assumes phone in hand | ✗ assumes tech literacy | Rewrite → `"No phone with you? You can sign out and finish later — your account is saved."` plus a Sign-out button |
| `"Almost done. We'll text a 6-digit code to confirm it's you."` | ✓ clear + warm | ✓ clear + warm | Keep |
| `"Welcome aboard. Your account is ready."` | ✓ warm | ✓ warm | Keep |
| `"Oops! Something went wrong."` | ✗ humor in failure | ✗ humor in failure | Rewrite → `"We couldn't sign you in. Try again in a moment, or use email instead."` |

---

## Banned phrases (lint these out)

The banned list is enforceable. Treat the table as a regex pass over every string a user can see. Finding any of these in a diff is a blocker, not a suggestion — the alternative is always shorter and warmer.

| Banned | Why | Use instead |
|---|---|---|
| `invalid` | Diagnostic jargon; reads as blame (NN/g, GOV.UK) | `"doesn't match"`, `"isn't a phone number we recognize"` |
| `incorrect` | Same | `"doesn't match"` |
| `illegal`, `forbidden`, `prohibited` | Criminal register on a form error | `"we can't accept …"` |
| `oops`, `whoops` | Humor in failure reads as mockery (UX Writing Hub) | omit; lead with the fix |
| `please` | Implies the user has a choice; forms aren't requests (GOV.UK) | omit |
| `sorry` | Adds nothing the user can act on (GOV.UK) | replace with the next step |
| `you forgot`, `you didn't` | Blames the user (NN/g) | `"we need …"`, `"add a …"` |
| `credential`, `token`, `authenticate`, `unauthorized` | Fails the 70-year-old test | `"sign-in details"`, `"code"`, `"sign in"`, `"can't sign in"` |
| `verification expired` | Jargon that fails both persona tests | `"That code expired"` |
| `!` (anywhere in errors) | Tone mismatch (Shopify Polaris caps at one per page) | period — and spend the one allowed `!` per session on the welcome moment, never on a status update |
| ALL CAPS | 13-18% harder to read (GOV.UK); reads as shouting | sentence case |

Concrete rewrites:

```text
❌ "Invalid credentials."
✅ "That email and password don't match. Try again, or reset your password."

❌ "Verification token expired. Please re-initiate authentication."
✅ "That code expired. We'll send a new one — check your phone."

❌ "Oops! Something went wrong."
✅ "We couldn't send the code. Try again in a moment, or use email instead."

❌ "You forgot to fill in a required field."
✅ "Enter your email to continue."

❌ "SUCCESSFULLY VERIFIED!"
✅ "Your phone is verified. Welcome aboard."
```

---

## Conformance floor

These are not aspirational. Every auth surface clears all of them before it ships.

### WCAG 2.2 (Oct 2023 — new criteria are AA)

- **3.3.1 Error Identification** — programmatically identify and describe each error.
- **3.3.2 Labels or Instructions** — visible labels above every field. Never placeholder-as-label.
- **3.3.3 Error Suggestion** — suggest the fix when known.
- **3.3.7 Redundant Entry** — don't ask for the same information twice in a flow.
- **3.3.8 Accessible Authentication (Minimum)** — no cognitive function test on the critical path. **Allow paste; do not block password managers; OTP must be enterable as a single pasted string** (per-digit boxes fight iOS/Android SMS autofill and fail dexterity-limited users — they're now an anti-pattern).
- **2.5.5 Target Size** — 24×24 CSS px minimum for interactive controls. The recommended floor for primary actions on mobile is **44×44** (touch + thumb reach).
- **1.4.3 Contrast (Minimum)** — 4.5:1 for body text, 3:1 for large text.

### NIST SP 800-63B Rev. 4 (Aug 2025, final)

- Min 8 chars; min 15 when password is the only authenticator.
- Max **at least 64 chars**; allow all printable Unicode including spaces.
- **No composition rules** (no forced upper/lower/digit/symbol).
- **No periodic rotation**; rotate only on evidence of compromise.
- **Block-list the full password** against breached corpora (HIBP Pwned Passwords API).
- Store with Argon2id (≥19 MiB memory, t=2, p=1; standard config 46 MiB, t=1, p=1). bcrypt cost ≥10 for legacy only.
- No security questions, no password hints.
- SMS is now a **restricted authenticator** — permitted, but the RP must (a) offer a non-restricted alternative and (b) disclose the risk.

### OWASP ASVS V6 + Authentication Cheat Sheet

- Generic error message: `"That email and password don't match"` — never reveal which was wrong.
- Constant-time login response; identical code path for missing user vs wrong password.
- Forgot-password endpoint: same anti-enumeration response regardless of whether the email exists — `"If an account exists for that email, we've sent a reset code."`
- Exponential backoff over hard lockout. Hard lockout is itself a DoS primitive. Pattern: 1s → 2s → 4s …, cap 15 min. Per-IP and per-account.
- MFA hierarchy: passkey (FIDO2) > TOTP > push > SMS.

### Touch + readability

- ≥ 16 px body text (CSS px). Smaller on auth screens fails the 70-year-old test.
- ≥ 48 px primary action height on mobile. shadcn's `Button` default is typically below the 44 px target — use the `lg` variant (or `className="h-11"`) for primary auth CTAs and verify against your `components/ui/button.tsx` rather than trusting a fixed class name.
- ≥ 4.5:1 contrast in both light and dark themes. Audit both.
- 6th-grade reading level. Tools: Hemingway, the GOV.UK reading-age check.

---

## Recovery decision matrix

Each scenario → ship at least one path that works.

| Lost factor | Working factors | Recovery path |
|---|---|---|
| Forgot password | email | Email a 6-digit reset code (not a link — see scanner-burn below). Rate-limit per email + per IP. |
| Lost phone (temporarily) | email + laptop | "Sign out and finish later — account saved." Then on return: sign in with email + password, re-verify on new device if applicable. |
| Lost phone (permanently) | email + backup codes | Sign in + 8-digit backup code. Backup codes shown once at MFA enrollment, regeneratable from any active session. |
| Lost email access | phone + backup codes | Phone-based recovery + backup code; identity-proof flow if neither available. |
| Lost everything | none | Published support phone number → human within 1 business day. Verify identity out-of-band. **Time-delayed recovery** (24-72 h hold) before reissuing access; notify every known channel during the hold so the legitimate owner can cancel if it wasn't them. |
| New device (known-good account) | password + email or phone | Generate one-time challenge to verified channel; on success, mark device as trusted for N days. |

**Hard rules:**

- Treat every recovery endpoint as a login endpoint for rate-limiting, lockout, and bot defense.
- **Two of three.** Never let a single factor (email-only) unlock recovery — that's the dominant account-takeover vector in 2025 incident reports. Require two of {verified email, verified phone, recovery code, trusted device}.
- Email after every password change/reset, sent to the registered address. If it wasn't the user, they need to know.
- Never unlock an account via support agent without out-of-band identity proof. Social engineering of support is the dominant ATO path in 2025.

---

## Pattern library

### Sign-up

**The form, top to bottom:**

1. **One question per screen on mobile if possible** (Linear/Notion/Cash App pattern); single-page form on desktop is acceptable for shorter flows.
2. **Email first** (always present; the universal account anchor).
3. **Password** — visible-by-default on mobile with a `Hide` toggle; hidden-by-default on desktop with a `Show` toggle (NN/g, Material 3). Requirements shown inline as the user types, not as a post-submit error.
4. **No confirm-password field.** The show/hide toggle replaces it (Baymard).
5. **Optional fields stay optional and clearly labeled** — `Display name (optional)`.
6. **Social/SSO buttons at the top** (above email) when supported. Google + Apple are table stakes for consumer apps. Email-and-password sibling must be visually equal weight, not a footnote link.
7. **Submit button** with verb-explicit copy: `Create account` (GOV.UK) or `Sign up` (consumer apps). Choose one per project; document. Submit-while-processing text mirrors the verb: `Creating account…`, not `Loading…`.

**Verification gating:**

- Better Auth's `auto-sign-in` is the right default — sign-up returns an active session. Email verification happens in parallel; gate privileged actions on it, not the welcome screen (Baymard: forced-verification-before-access hurts conversion 10-30%).
- Email-enumeration defense: when `requireEmailVerification` is on, signing up with an existing email returns success. Email the **real account holder** ("Someone tried to sign up with your email — sign in here or change your password if it wasn't you"). Never tell the form "this email is already taken." Better Auth ships `onExistingUserSignUp` for this.

**The lead Callout:** if the next step is a verification challenge that requires a specific device, say so before submit. Example for a phone-verify flow:

> *"Have your phone nearby. We'll text a 6-digit code the moment you submit. You can finish later if your phone isn't with you right now."*

### Sign-in

**The form:**

1. Email + password.
2. `Forgot?` link in the password label row, not below the button (faster scan).
3. `Sign in` button.
4. **Identifier-first / combined sign-in-or-up form** is an alternative: one email field, server decides whether to route to sign-in or sign-up. Clerk, Notion, Substack use this. Eliminates the "I don't remember if I have an account" friction.
5. Below the form: `New here? Create an account` link.

**New-device challenge** (when device fingerprint doesn't match):

- Surface the challenge BEFORE submit so the user isn't surprised. A small Callout above the submit button: *"Signing in from a new device? We'll text a 6-digit code to confirm it's you. Have your phone nearby."*
- After successful challenge, offer `Remember this device for 30 days` (Stripe/Vercel/Apple pattern). Default: checked. Explicit consent is required for the cookie.

### OTP verification (email or SMS)

- **6 digits, 10-minute TTL, single-use, ~30s resend cooldown.** This is the Twilio default and matches what Stripe, Cash App, Venmo, Apple, and Discord ship. Don't invent your own number length.
- **Single paste-friendly input**, not per-digit boxes. `<input inputMode="numeric" autocomplete="one-time-code" pattern="\d*" maxLength={6}>`. The per-digit-box pattern fights iOS/Android SMS autofill and fails dexterity-limited users — it's now an anti-pattern.
- Show the destination (masked) above the field: `Sent to •••• 1234.`
- Resend button with live cooldown: `You can request a new code in 0:42` → `Resend code`.
- **"I don't have my phone right now"** affordance, low-emphasis but always visible: opens an escape hatch with reassurance + sign-out. Apple's "Can't use this phone number" link is the canonical model. *"No phone with you? Sign out and finish later — your account is saved. We'll send a new code when you come back."*
- **Voice fallback** AFTER 3 SMS failures (not before) — premature voice fallback is itself an IRSF (International Revenue Share Fraud) vector. Twilio's explicit recommendation.
- For SMS body: `123456 is your <App> verification code. Don't share it with anyone.` Code at the start so it surfaces in notification previews. Comply with A2P 10DLC if you're in the US — OTP campaigns must register as `authentication`, not marketing, with sample copy matching production.

### Magic-link sign-in

- Acceptable for low-risk consumer flows; weak for high-value accounts (the user can be tricked into requesting + forwarding the link).
- **Scanner burn warning**: tokens consumed atomically on first GET. Outlook safe-links, Mimecast, and other corporate email scanners burn the token before the user clicks. If your audience is corporate or school, **prefer email-OTP** or add a "click to continue" intermediate page that requires a manual click after the auto-fetch.
- Token TTL ~10-30 min, single-use. Send via a properly-configured domain (SPF + DKIM + DMARC). Never embed user identity in the URL — use an opaque signed token.

### Forgot password

- Single email field. Submit returns the same response regardless of whether the email exists: *"If an account exists for that email, we've sent a reset code. Check your inbox in the next few minutes."*
- Email contains a **6-digit code** (preferred) or a magic link. Code wins on cross-device flows (user starts on phone, finishes on laptop).
- Reset form: code + new password. Apply the same password rules as sign-up.
- After reset: email the user a confirmation (`Your password was changed at <time> from <approx location>`). If it wasn't them, they have a paper trail.

### Passkey enrollment

- **Auto-prompt for passkey creation immediately after a successful sign-in.** eBay's 2025 data: this single placement drives ~75% of all passkey enrollments. Burying it in Settings stalls adoption at 5-10%.
- **Modal copy** (the short pitch): *"Skip the password next time. Use Face ID, Touch ID, or your screen unlock to sign in to <App>."* Lead with the benefit (faster + safer), not the technology (WebAuthn, FIDO2).
- **Progressive disclosure for the curious user.** Most people who haven't used a passkey before don't know what they're agreeing to — and "Use Face ID to sign in" reads to them as "give an app your face data." Pair the short pitch with a `Learn more` link or expandable section that runs through what a passkey actually is in plain language. The verbatim copy below has been persona-tested for both the 14-year-old phone-lost and the 70-year-old low-tech reader:

  > **What's a passkey?**
  >
  > A passkey is a sign-in shortcut that lives on your phone or laptop. Instead of typing a password, you confirm it's you the same way you unlock your device — Face ID, Touch ID, or your screen passcode. The unlock stays on your device; <App> only sees a yes-it's-them signal.
  >
  > It only works for <App>, so a fake site can't trick you into using it somewhere else. And your email and password still work — a passkey is in addition to them, not a replacement, unless you choose to remove the password later.
  >
  > If you switch phones, your passkey moves with you through iCloud Keychain, Google Password Manager, 1Password, or whichever password manager you already use. Lose the phone with no sync set up? Sign in with your email and password as usual.

  Three jobs, three short paragraphs: what it is (the shortcut), why it's safer (site-bound, phishing-resistant, no biometric leaves the device), what happens if it goes wrong (the password fallback). Do not extend past three paragraphs — anything longer reads as a contract.
- **Offer, never require.** Email + password stays as a permanent fallback. Many older users lack the biometric familiarity that makes passkeys feel natural, and on shared family devices a passkey on a parent's phone is the wrong default for a teen.
- **Conditional UI autofill** for sign-in: `autocomplete="username webauthn"` (webauthn LAST). Feature-detect via `PublicKeyCredential.isConditionalMediationAvailable()`.
- **Backup codes after enrollment**: audience-dependent. For B2B / security-savvy / regulated-industry users, the show-once-and-acknowledge pattern (Discord / Stripe / 1Password) is fine. For consumer audiences that fail the "somewhere safe outside the phone" test, offer backup codes as an opt-in in Settings instead of forcing them at enrollment. See the recovery-floor trade-off above.

### Account recovery (lost factor)

- Treat as a login endpoint. Rate-limit, log, alert on suspicious patterns.
- Each step asks for one piece of information. Email → code from email → second factor verification → identity proof if needed.
- **Time-delayed recovery for total loss**: 24-72 hour hold before access is reissued. During the hold, notify every known channel (all verified emails, all verified phones, all trusted devices) so the legitimate owner can cancel.
- Never use security questions. They're guessable by acquaintances, scrapable from social media, and forgotten by users.

### Lockout

- Exponential backoff per IP and per account, not hard lockout.
- Lockout copy: *"For your security, we've paused sign-ins from this device for 15 minutes. You can still reset your password."* Always offer the escape hatch.

---

## Trade-offs and recommended defaults

These are the contested decisions you must surface to the product owner — but for each one, this skill names a default to use when the owner has no strong preference. The defaults are starting positions, not silent picks: state them out loud, get a yes, and document the choice on the auth design page so the next reviewer doesn't relitigate.

### 1. Phone verification at sign-up: required vs optional vs absent

- **Required (with anti-sharing rationale)**: phone-as-identity locks one human to one account. Pattern: SaaS where shared accounts dilute the revenue model, communities where bans must stick, or audiences where multi-account abuse is a real cost. Friction is justified by the constraint; the recovery floor must be especially generous to compensate.
- **Optional, prompted post-signup**: collect phone after the user has invested in the product. Use it as a recovery factor + step-up auth, not as a gate. This is the common pattern when the cost of false-negative-no-verify is lower than the cost of lost conversions.
- **Absent**: email-only sign-up. Most edu-consumer and small-SaaS apps fall here. Recovery floor depends on email + backup codes + support phone.

**Default**: Absent for B2C consumer apps; Optional for SaaS where recovery resilience matters; Required only when shared-account abuse is a real, measured cost. State the choice explicitly per project — don't let the framework's defaults decide.

### 2. Magic link vs email OTP

- Magic link: fewer taps; breaks under email scanners and cross-device flows.
- Email OTP: works cross-device + survives scanners; one extra tap.
- Default: OTP for B2B / school / corporate audiences; either for B2C.

### 3. Password vs passwordless

- Passwordless-only (Notion, Substack): better completion + security, worse recovery if email is lost.
- Password + optional passkey (Stripe, Vercel): familiar, recovery-flexible, higher attack surface.
- Default: password + auto-prompted passkey post-sign-in. Don't eliminate passwords until the recovery story for "lost email" is bulletproof.

### 4. SMS 2FA acceptance

- NIST 800-63B-4: `"restricted, allowed with disclosure"`.
- OWASP ASVS V6: `"should be deprecated"`.
- Practical: acceptable as a bootstrap factor when offered alongside a non-restricted alternative (TOTP, passkey). Required disclosure: *"SMS can be intercepted. Set up an authenticator app or passkey for stronger protection."*

### 5. Recovery strictness

- Generous (Apple, Google): multiple trusted devices, recovery contacts, recovery keys. Better UX, larger ATO surface.
- Strict (Discord): lose backup codes + lose authenticator = lose account. Better security, harsher UX.
- **Default**: lean strict for high-value accounts (financial, medical, work identity), generous for consumer apps where the modal user loses access more often than they get attacked. Pick a position per project and document it on the recovery page itself so users understand the contract.

### 6. Account-deletion path

- Apple HIG (2022+) and Google Play (2024+) require an in-app account-deletion path if sign-up is offered. Not optional for app-store distribution.
- Web-only apps have no regulatory floor here yet (jurisdiction-dependent), but the same affordance is best-practice. Place it in Settings; require a confirmation flow; honor it.

### 7. Backup codes: forced vs opt-in vs absent

- **Forced show-once at MFA enrollment** (Discord, Stripe, GitHub): the user *cannot* finish enrollment without confirming they've saved the codes. Recovery story is bulletproof; UX friction is high.
- **Opt-in from profile/settings**: the user proactively visits "Save backup codes" if they want the safety net. Recovery story has a gap for users who never opt in; UX friction at first sign-in is zero.
- **Absent**: no backup codes at all. Recovery depends entirely on email + support contact. Simplest UX; worst-case recovery is slowest.
- **Default**: forced for B2B / security-savvy / regulated audiences; opt-in for B2C; absent only for low-stakes consumer products where the published support contact carries the recovery story.

This trade-off matters most for **audiences who fail the persona test on the "save these somewhere safe" pattern** — teens whose only device is the one they're saving from, older users for whom "backup codes" is unfamiliar vocabulary. For those audiences, opt-in is the right shape: power users who think about lost access can take it; the modal user isn't pushed off the funnel at first sign-in.

---

## Stack-specific guidance

### Better Auth

Defer integration mechanics to the `better-auth` skill. The UX-specific concerns this skill owns:

**Auto-sign-in after sign-up is the default and the right one.** `signUp.email` returns an active session; don't build a separate "now sign in" step. The inverse of what BA expects.

**Email verification has three trigger modes** (`sendOnSignUp`, `requireEmailVerification`, manual `sendVerificationEmail`). The opinionated default for security-sensitive apps: `sendOnSignUp: true` + `requireEmailVerification: false` on sign-in. Pair with `requireEmailVerification: true` only when you also implement a visible resend-cooldown UI — otherwise every sign-in attempt for an unverified user re-sends the email and you'll spam the inbox.

**Email enumeration is intentional** (when `requireEmailVerification` is on, sign-up with an existing email returns success). Use `onExistingUserSignUp` to notify the real account holder via email. Never tell the form.

**Passkey-first onboarding shipped in v1.6** (April 2026). `registration.requireSession: false` + a `resolveUser()` implementation lets you register a passkey *before* a session exists. Lead with this pattern in new builds; pre-1.6 tutorials treating passkey as a post-login add-on are stale.

**`hydrateSession`** (v1.7+) eliminates the auth-spinner-on-first-paint anti-pattern. Use it.

**Magic-link tokens are consumed atomically on first GET.** Outlook safe-links burn them. See the scanner-burn pattern above.

**Two-factor sign-in does NOT auto-complete** — you get `twoFactorRedirect: true` and must call a second endpoint. Forward cookies between chained `auth.api.*` calls.

**Error code → copy translation table.** Better Auth returns machine codes; the user-facing copy is your job. Use this table as the floor:

| BA code | User-facing copy |
|---|---|
| `INVALID_EMAIL_OR_PASSWORD` | `"That email and password don't match. Try again, or reset your password."` |
| `USER_ALREADY_EXISTS` | (in sign-up: don't surface; trigger `onExistingUserSignUp` instead) |
| `EMAIL_NOT_VERIFIED` | `"Check your email for a verification link. We sent it to <masked>."` + Resend button |
| `PASSWORD_TOO_SHORT` | `"Password needs at least 8 characters."` |
| `INVALID_TOKEN`, `EXPIRED_TOKEN` | `"That link expired. We'll send a new one — check your email."` |
| `INVALID_OTP` | `"That code didn't match. Try again, or tap Resend."` |
| `TOO_MANY_ATTEMPTS` | `"Too many attempts. Wait a few minutes and try again."` |
| `FAILED_TO_CREATE_USER` | `"We couldn't create your account. Try again in a moment."` (log the actual error server-side) |

**i18n** (BA 1.5+) handles error translation if configured. Reference the i18n key namespace rather than hand-rolling English strings.

**UI components**: BA ships none. The community standard is **better-auth-ui.com** (shadcn-based, MIT). Worth evaluating before building auth UI from scratch.

### Twilio Verify

Defer transport mechanics to Twilio docs. The UX-specific concerns this skill owns:

**Channel selection in 2026:**

- **Default to `channel=auto`** (Pilot, sales-gated): Silent Network Authentication tried first, SMS fallback. SNA is invisible, 2-4 sec, currently 9 countries (US, CA, UK, DE, FR, ES, IT, NL, ID). Wi-Fi-only and roaming users fall through to SMS.
- **RCS Upgrade is default-on** for SMS — OTPs auto-upgrade where the handset supports it.
- **WhatsApp first → SMS fallback** in markets with high WhatsApp penetration (Brazil, India, Indonesia, Germany). Immune to SMS pumping (IP, not telecom); free on undelivered.
- **Voice** AFTER 3 SMS failures (toll-fraud guide). Includes anti-fraud keypad challenge; supports many languages.
- **Email OTP** when SmsPumpingRisk is elevated or phone is unreliable.

**SMS-pumping defense** (the UX layer — Fraud Guard handles the rest):

- Run **Lookup v2 with SmsPumpingRisk** before Verify. Thresholds: 0-60 low, 60-75 mild (add friction), 75-90 moderate (route to alternate channel), 90-100 high (block).
- Country selector defaulting to IP-resolved country; flag mismatch as a risk signal.
- Phone-format validation via `libphonenumber-js` BEFORE the request is constructed.
- Per-IP cap 10/hour, per-phone cap 3-5/hour, per-device-fingerprint cap.
- Invisible CAPTCHA (Turnstile or reCAPTCHA v3) on the phone form. Visible challenge only on risk-score escalation.
- Geographic Permissions allowlist on the Verify Service.
- Monitor `validated/sent` ratio by country AND ASN; pumping shows up first as ASN anomalies.

**Phone normalization (server + client):**

Single source of truth — a `normalizeUsPhone(input)` or equivalent E.164 normalizer. Strip non-digit characters, then map to `+CCXXXXXXXXXX`. Accept input in any common shape: `(512) 555-1234`, `1-512-555-1234`, `+1 (512) 555-1234`. The strict E.164 regex is the post-normalize check, not the input gate. **Don't reject the user for shape choices** — the normalizer's job is to forgive.

**Preserve cursor position** when an input auto-normalizes (snap to canonical on the 10th digit). The standard fix: track a `snapped` ref, `useLayoutEffect` to restore selection to end-of-string. Same pattern Stripe/Twilio/Plaid use.

**A2P 10DLC compliance** (US, since Feb 1 2025): unregistered SMS is 100% blocked. OTP campaigns must register as `authentication` (not marketing) with sample copy matching what production sends.

### Other stacks

- **Resend / SendGrid / Postmark** — the `resend` skill (or equivalent) owns send mechanics. This skill owns the **content** of verification + reset emails.
- **Clerk / Auth0 / Descope** — drop-in components are configurable; pick the configuration that aligns with this skill's patterns. The `clerk` / `vercel:auth` skills cover SDK specifics.
- **Lucia / Auth.js** — manual session management. Apply the same UX patterns; the session implementation is orthogonal.

---

## Anti-pattern catalog

If the code under review matches any of these, fix before shipping.

- **Per-digit OTP boxes**. Fights iOS/Android SMS autofill, fails dexterity-limited users. Use a single `inputMode="numeric" autocomplete="one-time-code"` input.
- **`"User not found"` vs `"Wrong password"`** enumeration on sign-in. Use the generic combined message.
- **Email enumeration on forgot-password**. *"No account found for that email"* leaks. Use the generic *"If an account exists…"*.
- **Forced periodic password rotation**. NIST removed this in 2017; rotating without cause makes users pick weaker passwords.
- **Security questions**. Guessable by acquaintances, scrapable from social media, forgotten by users. NIST deprecated.
- **Password complexity rules**. *"Must contain an uppercase letter and a symbol"* — NIST removed these. Block the breach list instead.
- **Confirm-password field**. Replaced by the show/hide toggle.
- **Placeholder-as-label**. Fails WCAG 3.3.2. Use visible labels above every field.
- **Hard lockout** (`"Account locked for 24 hours"`). Use exponential backoff + offer the reset escape hatch.
- **Magic link in scanner-prone environments** without an intermediate "click to continue" page.
- **`requireEmailVerification: true` + no resend cooldown UI** — spams the inbox on every sign-in attempt by an unverified user.
- **Email-only recovery** as the single path. Two-of-three is the floor.
- **Support-agent-only unlock** without out-of-band identity proof. Social-engineering vector.
- **Auth `<Spinner />` on first paint** when using Better Auth pre-1.7. Use `hydrateSession`.
- **`role="dialog"` without focus trap or initial focus**. WAI-ARIA modal requirements.
- **Verify-phone with no "I don't have my phone" affordance**. The user stuck on this screen is the highest-friction abandonment point in the entire funnel.

---

## When to invoke

Triggers (Claude scans these on every read/write):

- Filenames matching `sign-up*`, `sign-in*`, `signup*`, `signin*`, `verify-*`, `forgot-password*`, `reset-password*`, anything in `/auth/`
- Files importing from `better-auth`, `@better-auth/*`, `twilio`, `next-auth`, `clerk`, `lucia`, `@auth/*`
- Editing email templates that contain verification codes or magic links
- Reviewing PRs that touch the auth funnel
- The user asks about auth UX, login flows, recovery, account safety, microcopy for auth, "users are abandoning at sign-up", "how do we handle MFA UX"

Do NOT invoke for:

- Pure backend auth wiring (defer to `better-auth`, `vercel:auth`, etc.)
- Authorization / RBAC (different domain)
- OAuth provider configuration (defer to stack skills)
- Marketing-funnel signup CRO (different goal — different skill, e.g. `writing-marketing-copy`)

---

## Cross-references

| Skill | When |
|---|---|
| `better-auth` | All Better Auth integration mechanics — SDK calls, plugin wiring, schema, session config |
| `resend` | Transactional email send mechanics (this skill owns the *content*) |
| `clerk`, `vercel:auth` | Hosted-auth provider configuration |
| `design-ninja` | General visual hierarchy, spacing, typography primitives |
| `frontend-design` | Distinctive visual treatment for auth surfaces that need it (rare — auth is usually neutral) |
| `writing-marketing-copy` | The marketing page that links TO sign-up (different voice, different goals) |
| `react-router-v7` | Route-module shape for sign-up/sign-in actions and loaders |
| `testing-ninja` | E2E tests for auth flows |

---

## Research and limitations

This skill is grounded in:

- NIST SP 800-63B Rev. 4 (final, Aug 2025)
- OWASP ASVS v5.0.0 + Authentication Cheat Sheet + Forgot Password Cheat Sheet
- WCAG 2.2 (Oct 2023, including the new 3.3.7 + 3.3.8 + 3.3.9 criteria)
- Nielsen Norman Group articles on auth, error messages, password creation, senior usability, teen usability
- Baymard Institute 19-ways-to-simplify-signup + delayed-account-creation research
- GOV.UK Design System + GOV.UK Service Manual auth patterns
- Mailchimp / Microsoft / Shopify Polaris / 18F / Atlassian content style guides
- FIDO Alliance passkey adoption research (Oct 2025 report)
- Twilio Verify developer best practices + toll-fraud guide
- Better Auth docs 1.6-1.7
- Per-app sign-up/sign-in flow review for Stripe, Linear, Vercel, Clerk, Notion, Apple ID, Cash App, Venmo, Discord, Substack, WhatsApp, Signal, Telegram, Khan Academy, Duolingo, Quizlet, IXL, Brilliant, Memrise

Known gaps to acknowledge when applying the skill:

- Source bias toward US/UK English-language design bodies. Less coverage of LATAM (WhatsApp-first markets) and APAC auth patterns.
- The two persona tests (14-year-old + 70-year-old) are framework grounded in NN/g + AARP + Pew data, not validated against actual users. Treat as hypotheses to falsify, not certainties.
- Better Auth and Twilio Verify ship updates monthly. Run a currency check on Better Auth ≥1.7 stable and Twilio's `channel=auto` GA status before relying on those patterns.
- This is a *design and copy* skill. Integration mechanics live in stack skills. If a recommendation here conflicts with a stack-skill recommendation on a mechanics point, the stack skill wins.
