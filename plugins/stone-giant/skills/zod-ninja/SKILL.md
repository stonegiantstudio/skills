---
description: Zod schema design for form validation in React Router v7 apps using Conform or TanStack Form. Triggers when editing files that import from zod, working with form validation, creating schemas for Conform or TanStack Form, or defining input validation for route actions.
---

# Zod Ninja

Expert guidance for Zod schema design in React Router v7 applications with Conform or TanStack Form.

## Core Principles

### 1. Schema-First Design

Define schemas before forms. The schema is the single source of truth for:

- Runtime validation
- TypeScript types (via `z.infer<typeof schema>`)
- Form field configuration
- Error messages

```typescript
// Schema defines everything
const ContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Type is derived, never manually defined
type ContactForm = z.infer<typeof ContactSchema>;
```

### 2. Coercion for Form Data

HTML forms submit strings. Use `z.coerce` for non-string types:

```typescript
const OrderSchema = z.object({
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
  date: z.coerce.date(),
  // ⚠️ NOT z.coerce.boolean() — that is Boolean(value), so the string
  // "false" coerces to `true`. Parse the string explicitly instead:
  enabled: z.preprocess((v) => v === "true", z.boolean()),
});
```

### 3. Validation at the Boundary

Validate in route actions, not components:

```typescript
// app/routes/contact.tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: ContactSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  // submission.value is fully typed and validated
  await sendEmail(submission.value);
  return redirect("/thank-you");
}
```

## Conform Integration

### Basic Setup

```typescript
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

export default function ContactForm() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ContactSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <Form method="post" id={form.id} onSubmit={form.onSubmit}>
      <input name={fields.name.name} />
      {fields.name.errors && <p>{fields.name.errors}</p>}
      {/* ... */}
    </Form>
  );
}
```

### With Action Data (React Router v7)

```typescript
import { useActionData } from "react-router";
import { getZodConstraint } from "@conform-to/zod";

export default function ContactForm() {
  const lastResult = useActionData<typeof action>();

  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(ContactSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ContactSchema });
    },
  });
  // ...
}
```

### Nested Objects

```typescript
const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
});

const UserSchema = z.object({
  name: z.string().min(1),
  address: AddressSchema,
});

// In form: fields.address.getFieldset()
const address = fields.address.getFieldset();
<input name={address.street.name} />
<input name={address.city.name} />
```

### Dynamic Arrays

```typescript
const InvoiceSchema = z.object({
  items: z.array(
    z.object({
      description: z.string().min(1),
      amount: z.coerce.number().positive(),
    })
  ).min(1, "At least one item required"),
});

// In form
const items = fields.items.getFieldList();
{items.map((item, index) => {
  const itemFields = item.getFieldset();
  return (
    <fieldset key={item.key}>
      <input name={itemFields.description.name} />
      <input name={itemFields.amount.name} type="number" />
    </fieldset>
  );
})}
```

## TanStack Form Integration

### Basic Setup with Zod Adapter

```typescript
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";

const ContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
});

export default function ContactForm() {
  const form = useForm({
    defaultValues: { name: "", email: "" },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: ContactSchema,
    },
    onSubmit: async ({ value }) => {
      // value is typed from schema
      await submitContact(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        children={(field) => (
          <>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </>
        )}
      />
    </form>
  );
}
```

### With React Router v7 Actions

```typescript
// Validate in action, use TanStack Form for UX
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const result = ContactSchema.safeParse(data);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await processContact(result.data);
  return redirect("/success");
}
```

## Schema Patterns

### Optional with Default

```typescript
const SettingsSchema = z.object({
  theme: z.enum(["light", "dark"]).default("light"),
  notifications: z.coerce.boolean().default(true),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});
```

### Conditional Fields (Discriminated Unions)

Use `discriminatedUnion` when each variant has **different fields**:

```typescript
const PaymentSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("card"),
    cardNumber: z.string().regex(/^\d{16}$/),
    expiry: z.string().regex(/^\d{2}\/\d{2}$/),
    cvv: z.string().regex(/^\d{3,4}$/),
  }),
  z.object({
    method: z.literal("bank"),
    accountNumber: z.string().min(1),
    routingNumber: z.string().regex(/^\d{9}$/),
  }),
  z.object({
    method: z.literal("paypal"),
    email: z.string().email(),
  }),
]);
```

**When the fields are the same but constraints differ** (e.g., same
`targetPercent` field but different max depending on a mode), use
`.superRefine()` instead — see [Cross-Field Validation Pattern](#cross-field-validation-pattern).

### Refinements for Complex Validation

```typescript
const PasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Error appears on confirmPassword field
  });
```

### Transform for Data Normalization

```typescript
const ProfileSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  username: z
    .string()
    .min(3)
    .transform((val) => val.toLowerCase().replace(/\s+/g, "-")),
  tags: z
    .string()
    .transform((val) => val.split(",").map((t) => t.trim()))
    .pipe(z.array(z.string().min(1))),
});
```

### File Uploads

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const UploadSchema = z.object({
  avatar: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "Max file size is 5MB")
    .refine(
      (file) => ACCEPTED_TYPES.includes(file.type),
      "Only .jpg, .png, and .webp formats are supported"
    ),
});
```

### Async Validation (Server-Side)

```typescript
// Define sync schema for client
const SignupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
});

// Extend with async checks in action
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: SignupSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  // Async validation
  const emailExists = await db.user.findUnique({
    where: { email: submission.value.email },
  });

  if (emailExists) {
    return submission.reply({
      fieldErrors: { email: ["This email is already registered"] },
    });
  }

  // Proceed with valid data
  await createUser(submission.value);
  return redirect("/welcome");
}
```

## Anti-Patterns to Avoid

### Don't: Manual Type Definitions

```typescript
// BAD: Types can drift from schema
interface UserForm {
  name: string;
  age: number;
}
const UserSchema = z.object({
  name: z.string(),
  age: z.coerce.number(),
});

// GOOD: Derive types from schema
const UserSchema = z.object({
  name: z.string(),
  age: z.coerce.number(),
});
type UserForm = z.infer<typeof UserSchema>;
```

### Don't: Validate in Components

```typescript
// BAD: Validation logic scattered
function handleSubmit(data: FormData) {
  if (!data.get("email")?.toString().includes("@")) {
    setError("Invalid email");
    return;
  }
  // ...
}

// GOOD: Schema handles all validation
const submission = parseWithZod(formData, { schema: ContactSchema });
```

### Don't: Overly Permissive Schemas

```typescript
// BAD: Accepts any string
const StatusSchema = z.object({
  status: z.string(),
});

// GOOD: Explicit allowed values
const StatusSchema = z.object({
  status: z.enum(["pending", "active", "completed", "cancelled"]),
});
```

### Don't: Forget Coercion for FormData

```typescript
// BAD: Will fail - formData sends strings
const OrderSchema = z.object({
  quantity: z.number(), // "5" is not a number!
});

// GOOD: Coerce string to number
const OrderSchema = z.object({
  quantity: z.coerce.number(),
});
```

## Error Message Best Practices

### User-Friendly Messages

```typescript
const ProfileSchema = z.object({
  username: z
    .string({ required_error: "Please choose a username" })
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),

  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .optional(),
});
```

### Contextual Error Messages

```typescript
const CheckoutSchema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, "Enter a valid 16-digit card number"),

  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format")
    .refine((val) => {
      const [month, year] = val.split("/").map(Number);
      const expiry = new Date(2000 + year, month);
      return expiry > new Date();
    }, "Card has expired"),
});
```

## Multi-Step Form Validation

### With Conform

```typescript
const StepOneSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const StepTwoSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
});

const FullSchema = StepOneSchema.merge(StepTwoSchema);

// Validate only current step fields
export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const schema = step === 1 ? StepOneSchema : StepTwoSchema;

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  // On final step, validate entire form in action
}
```

### With TanStack Form

```typescript
const form = useForm({
  defaultValues: { email: "", password: "", name: "", company: "" },
  validatorAdapter: zodValidator(),
});

async function handleNextStep() {
  // Validate only step 1 fields
  const isValid = await form.validateField("email") &&
                  await form.validateField("password");
  if (isValid) setStep(2);
}
```

## Async Validation with Debouncing

For username/email availability checks, debounce to prevent API spam:

```typescript
import { useDebouncedCallback } from "use-debounce";

export default function SignupForm() {
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const checkUsername = useDebouncedCallback(async (username: string) => {
    if (username.length < 3) return;
    const response = await fetch(`/api/check-username?q=${username}`);
    const { available } = await response.json();
    setUsernameAvailable(available);
  }, 300);

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SignupSchema });
    },
  });

  return (
    <Form method="post" id={form.id} onSubmit={form.onSubmit}>
      <input
        name={fields.username.name}
        onChange={(e) => checkUsername(e.target.value)}
      />
      {usernameAvailable === false && (
        <p className="text-red-500">Username taken</p>
      )}
    </Form>
  );
}
```

## Performance Optimization

### Large Forms (100+ Fields)

For forms with many fields, avoid performance issues:

```typescript
// Use onSubmit validation mode (not onChange)
const [form, fields] = useForm({
  shouldValidate: "onSubmit", // Don't validate on every keystroke
  shouldRevalidate: "onBlur", // Revalidate only on blur
  onValidate({ formData }) {
    return parseWithZod(formData, { schema: LargeFormSchema });
  },
});
```

### Split Large Schemas

```typescript
// Instead of one massive schema
const MassiveSchema = z.object({ /* 50 fields */ });

// Split into logical groups
const PersonalInfoSchema = z.object({ name: z.string(), email: z.string().email() });
const AddressSchema = z.object({ street: z.string(), city: z.string() });
const PreferencesSchema = z.object({ theme: z.enum(["light", "dark"]) });

// Compose when needed
const FullProfileSchema = PersonalInfoSchema
  .merge(AddressSchema)
  .merge(PreferencesSchema);
```

### Lazy Validation for Tabs/Sections

Only validate visible sections:

```typescript
function TabbedForm() {
  const [activeTab, setActiveTab] = useState("personal");

  const schemaForTab = {
    personal: PersonalInfoSchema,
    address: AddressSchema,
    preferences: PreferencesSchema,
  }[activeTab];

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: schemaForTab });
    },
  });
  // Only renders/validates current tab
}
```

## Zod v4 Compatibility

### Breaking Changes to Know

**`z.coerce` input type is now `unknown`:**

```typescript
// Zod v3
const schema = z.coerce.number();
type Input = z.input<typeof schema>; // number

// Zod v4
type Input = z.input<typeof schema>; // unknown

// Fix: Specify input type explicitly if needed
const schema = z.coerce.number<string>(); // Input is string
```

**`.default()` applies to output, not input:**

```typescript
// Zod v4: default must match OUTPUT type
const schema = z.string()
  .transform((val) => val.length)
  .default(0); // number (output type), not string

// Use .prefault() for input-type defaults (v3 behavior)
const schema = z.string()
  .prefault("default value") // applies before transform
  .transform((val) => val.length);
```

### New v4 Features

```typescript
// Top-level format schemas (v4) — preferred over the chained z.string().email()
const Email = z.email();
const Id = z.uuid();
const Link = z.url();

// .overwrite() — like .transform(), but keeps the schema's type (stays a
// ZodString), so it can still be chained and introspected
const Trimmed = z.string().overwrite((s) => s.trim());

// "exactly one of" is an object-level refinement, not a schema method:
const ContactMethod = z
  .object({ email: z.email().optional(), phone: z.string().regex(/^\d{10}$/).optional() })
  .refine((v) => Boolean(v.email) !== Boolean(v.phone), {
    message: "Provide exactly one of email or phone",
  });
```

### Known Issues

**Empty strings with `.optional()`:**

```typescript
// BUG: "" triggers validation error with .optional() in v4
const schema = z.object({
  nickname: z.string().optional(), // "" fails!
});

// Workarounds:
// 1. Use .nullish()
nickname: z.string().nullish(),

// 2. Accept empty string explicitly
nickname: z.string().optional().or(z.literal("")),

// 3. Preprocess empty to undefined
nickname: z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().optional()
),
```

## Testing Schemas

```typescript
import { describe, it, expect } from "vitest";

describe("ContactSchema", () => {
  it("accepts valid data", () => {
    const result = ContactSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      message: "Hello, this is a test message.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = ContactSchema.safeParse({
      name: "John",
      email: "not-an-email",
      message: "Hello world!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it("coerces string numbers", () => {
    const result = OrderSchema.safeParse({
      quantity: "5", // String from form
      price: "19.99",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(5);
      expect(typeof result.data.quantity).toBe("number");
    }
  });
});
```

## Critical Rules

### Always Do

- Set `defaultValues` in TanStack Form to prevent uncontrolled component warnings
- Use `field.key` (Conform) or `field.id` (TanStack) as React keys in arrays, never index
- Validate on both client AND server - never skip server validation
- Use `z.infer<typeof Schema>` for types, never define manually
- Specify `path` in refinements to direct errors to correct fields
- When a field's constraint depends on a sibling field's value, use
  `.superRefine()` at the object level — standalone `.min()`/`.max()`
  can be bypassed with mismatched combinations. See
  [Cross-Field Validation Pattern](#cross-field-validation-pattern)

### Never Do

- Skip server validation (security risk - client validation is bypassable)
- Use array index as React key in dynamic field lists
- Mix controlled and uncontrolled input patterns
- Mutate form values directly instead of using form methods
- Forget coercion when parsing FormData (strings only!)
- Use standalone `.min()`/`.max()` when the constraint depends on a sibling
  field — this creates a server-side bypass where mismatched combinations
  pass validation

### Cross-Field Validation Pattern

When a constraint on field A depends on the value of field B, validate
at the object level:

```typescript
// BAD: standalone max is always 200, ignoring method
const ProfitSchema = z.object({
  method: z.enum(["margin", "markup"]),
  targetPercent: z.coerce.number().min(0).max(200),
});

// GOOD: max depends on method
const ProfitSchema = z
  .object({
    method: z.enum(["margin", "markup"]),
    targetPercent: z.coerce.number().min(0),
  })
  .superRefine((data, ctx) => {
    const max = data.method === "margin" ? 100 : 200;
    if (data.targetPercent > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: max,
        type: "number",
        inclusive: true,
        path: ["targetPercent"],
        message: `${data.method} percent cannot exceed ${max}%`,
      });
    }
  });
```

**Detection:** When reviewing schemas, check every `.min()`, `.max()`,
`.regex()`, and `.refine()` on a field — does the constraint logically
depend on a sibling field (discriminator, mode, type, category)? If yes,
it must be lifted to `.superRefine()` or `.refine()` at the object level.
