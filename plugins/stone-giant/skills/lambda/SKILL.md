---
description: AWS Lambda and CDK expertise for serverless functions, infrastructure as code, event-driven architectures, cold start optimization, and production patterns. Use when writing Lambda handlers, CDK stacks, NodejsFunction constructs, configuring triggers, optimizing performance, or any serverless compute patterns. Triggers on Lambda, serverless, handler, cold start, event source, API Gateway integration, CDK, infrastructure as code, CloudFormation.
---

# AWS Lambda & CDK

Expert guidance for AWS Lambda serverless functions and AWS CDK infrastructure as code. Covers handler patterns, event sources, cold start optimization, error handling, CDK constructs, deployment pipelines, and production-ready architectures.

## Prerequisites

**AWS CLI must be installed and configured.** If not set up, prompt the user:

```text
AWS CLI Setup Required:
1. Install: brew install awscli (macOS) or see https://aws.amazon.com/cli/
2. Configure: aws configure
   - Enter Access Key ID, Secret Access Key, Region
3. Verify: aws sts get-caller-identity

For CDK specifically:
4. Install CDK: npm install -g aws-cdk
5. Bootstrap account: cdk bootstrap aws://ACCOUNT-ID/REGION
```

## Core Philosophy

**Lambda is not a server.** It's an event-driven compute service with different constraints. Embrace statelessness, design for cold starts, and let AWS handle scaling.

**Minimize cold starts.** Cold starts are the #1 performance concern. Keep bundles small, initialize outside the handler, and choose the right memory/architecture.

**Cost follows invocations.** You pay per request and GB-seconds. Optimize for execution time, not uptime. Right-size memory (often higher memory = faster = cheaper).

---

## Function Configuration

### Runtime Selection

```text
Recommended for TypeScript/JavaScript:
- nodejs20.x (LTS, best performance)
- nodejs22.x (latest features)

Avoid:
- nodejs18.x (approaching EOL)
- Custom runtimes (complexity, cold starts)
```

### Memory & Architecture

```typescript
// Memory affects CPU allocation proportionally
// 1,769 MB = 1 full vCPU

const MEMORY_GUIDELINES = {
  // Light compute (API proxies, simple transforms)
  light: 256,      // 0.14 vCPU

  // Standard workloads (most APIs, CRUD)
  standard: 512,   // 0.29 vCPU

  // Compute-heavy (image processing, ML inference)
  heavy: 1024,     // 0.58 vCPU

  // CPU-bound (video, complex algorithms)
  intensive: 1769, // 1 full vCPU

  // Max performance (parallel processing)
  max: 3008,       // 1.7 vCPU (or 10240 for 6 vCPU)
};

// Architecture: ARM is 20% cheaper, often faster
const ARCHITECTURE = 'arm64'; // Graviton2, prefer over x86_64
```

### Timeout Guidelines

```text
API Gateway integration: 29 seconds max (API Gateway limit)
Direct invocation:       Up to 15 minutes
Event processing:        Match SQS visibility timeout

Rule: Set timeout to 2-3x expected execution time
      Never use max (15 min) unless truly needed
```

### Essential Configuration

```typescript
// Recommended production settings
const functionConfig = {
  runtime: 'nodejs20.x',
  architecture: 'arm64',
  memorySize: 512,
  timeout: 30,

  // Environment variables (not for secrets!)
  environment: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
    // Use SSM/Secrets Manager for secrets
  },

  // Reserved concurrency (protect downstream)
  reservedConcurrency: 100,

  // Provisioned concurrency (eliminate cold starts)
  // Only for latency-critical paths
  provisionedConcurrency: 5,
};
```

---

## Handler Patterns

### Basic Handler Structure

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

// Initialize OUTSIDE handler (runs once per container)
const dbPool = createDbPool();
const config = loadConfig();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  // Don't wait for event loop to empty
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const result = await processRequest(event);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Handler error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### Typed Event Handlers

```typescript
import type {
  APIGatewayProxyHandlerV2,
  SQSHandler,
  S3Handler,
  EventBridgeHandler,
  ScheduledHandler,
} from 'aws-lambda';

// API Gateway HTTP API (v2)
export const apiHandler: APIGatewayProxyHandlerV2 = async (event) => {
  const { pathParameters, queryStringParameters, body } = event;
  // ...
};

// SQS Queue
export const sqsHandler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    await processMessage(body);
  }
};

// S3 Events
export const s3Handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    await processObject(bucket, key);
  }
};

// EventBridge
export const eventBridgeHandler: EventBridgeHandler<
  'custom.event',
  { orderId: string }
> = async (event) => {
  const { orderId } = event.detail;
  await processOrder(orderId);
};

// Scheduled (CloudWatch Events / EventBridge)
export const scheduledHandler: ScheduledHandler = async (event) => {
  console.log('Scheduled execution:', event.time);
  await runMaintenanceTask();
};
```

### Response Patterns

```typescript
// Success responses
const success = (data: unknown) => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'max-age=300',
  },
  body: JSON.stringify(data),
});

// Error responses
const error = (statusCode: number, message: string) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: message }),
});

// Redirect
const redirect = (location: string) => ({
  statusCode: 302,
  headers: { Location: location },
  body: '',
});

// No content
const noContent = () => ({
  statusCode: 204,
  body: '',
});
```

---

## Cold Start Optimization

### Understanding Cold Starts

```text
Cold start phases:
1. Container init (~100-500ms) - AWS provisions container
2. Runtime init (~50-200ms)    - Node.js starts
3. Handler init (variable)      - Your code outside handler runs
4. Handler execution            - Your handler runs

You control: Handler init + Handler execution
AWS controls: Container init + Runtime init
```

### Minimization Strategies

```typescript
// 1. Initialize outside handler
// ✅ Good: Runs once per container
const s3 = new S3Client({ region: 'us-east-1' });
const dbPool = createPool(process.env.DATABASE_URL);

export const handler = async (event) => {
  // Use pre-initialized clients
  await s3.send(new GetObjectCommand({ /* ... */ }));
};

// ❌ Bad: Runs on every invocation
export const handler = async (event) => {
  const s3 = new S3Client({ region: 'us-east-1' });
  // ...
};
```

```typescript
// 2. Lazy initialization for rarely-used dependencies
let heavyClient: HeavyClient | null = null;

function getHeavyClient() {
  if (!heavyClient) {
    heavyClient = new HeavyClient(); // Only init when needed
  }
  return heavyClient;
}

export const handler = async (event) => {
  if (event.needsHeavyProcessing) {
    const client = getHeavyClient();
    // ...
  }
};
```

```typescript
// 3. Keep bundles small
// Use esbuild with tree-shaking
// Import specific modules, not entire SDK

// ✅ Good: ~50KB
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// ❌ Bad: ~2MB
import AWS from 'aws-sdk';
```

### Bundle Size Optimization

```typescript
// esbuild.config.js
import { build } from 'esbuild';

await build({
  entryPoints: ['src/handler.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/handler.js',
  external: [
    // AWS SDK v3 is included in Lambda runtime
    '@aws-sdk/*',
  ],
  treeShaking: true,
});

// Typical results:
// Before: 15MB node_modules
// After: 200KB bundle
```

### Provisioned Concurrency

```typescript
// For latency-critical endpoints only
// Cost: ~$0.015/hour per provisioned instance

// Use cases:
// - User-facing APIs requiring <100ms p99
// - Webhook receivers with SLAs
// - Auth endpoints (login, token refresh)

// NOT for:
// - Background jobs
// - Internal APIs
// - Low-traffic functions
```

---

## Error Handling & Retries

### Structured Error Handling

```typescript
// Custom error classes
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(public resource: string, public id: string) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

// Handler with error mapping
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const result = await processRequest(event);
    return success(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return error(400, err.message);
    }
    if (err instanceof NotFoundError) {
      return error(404, err.message);
    }

    // Log unexpected errors, return generic message
    console.error('Unexpected error:', err);
    return error(500, 'Internal server error');
  }
};
```

### Retry Behavior by Event Source

```text
Event Source        Retry Behavior
─────────────────────────────────────────────
API Gateway         No retries (synchronous)
SQS                 Retries until visibility timeout
                    Then DLQ after maxReceiveCount
SNS                 3 retries, exponential backoff
EventBridge         185 retries over 24 hours
S3                  Retries on failure
DynamoDB Streams    Retries until data expires (24h)
Kinesis             Retries until data expires (7d default)
```

### Dead Letter Queues

```typescript
// Always configure DLQ for async invocations
const functionConfig = {
  deadLetterQueue: {
    targetArn: 'arn:aws:sqs:us-east-1:123456789:my-dlq',
  },
  // Or use destinations for more control
  onFailure: {
    destination: 'arn:aws:sqs:us-east-1:123456789:my-dlq',
  },
  onSuccess: {
    destination: 'arn:aws:events:us-east-1:123456789:event-bus/default',
  },
};
```

### Idempotency

```typescript
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient({});

async function ensureIdempotent(
  idempotencyKey: string,
  operation: () => Promise<void>
) {
  try {
    // Try to claim the key
    await dynamodb.send(new PutItemCommand({
      TableName: 'idempotency',
      Item: {
        pk: { S: idempotencyKey },
        ttl: { N: String(Math.floor(Date.now() / 1000) + 86400) },
        status: { S: 'processing' },
      },
      ConditionExpression: 'attribute_not_exists(pk)',
    }));

    // Execute operation
    await operation();

    // Mark complete
    await dynamodb.send(new PutItemCommand({
      TableName: 'idempotency',
      Item: {
        pk: { S: idempotencyKey },
        ttl: { N: String(Math.floor(Date.now() / 1000) + 86400) },
        status: { S: 'completed' },
      },
    }));
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      console.log('Duplicate request, skipping:', idempotencyKey);
      return;
    }
    throw err;
  }
}

// Usage in SQS handler
export const sqsHandler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    await ensureIdempotent(record.messageId, async () => {
      await processMessage(JSON.parse(record.body));
    });
  }
};
```

---

## Logging & Monitoring

### Structured Logging

```typescript
// Use JSON for CloudWatch Logs Insights queries
function log(level: string, message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId: process.env.AWS_REQUEST_ID,
    ...data,
  }));
}

// Usage
log('info', 'Processing order', { orderId: '123', items: 5 });
log('error', 'Payment failed', { orderId: '123', error: err.message });

// CloudWatch Logs Insights query:
// fields @timestamp, level, message, orderId
// | filter level = 'error'
// | sort @timestamp desc
// | limit 100
```

### Key Metrics to Monitor

```text
Metric                  Alert Threshold    Why
────────────────────────────────────────────────────
Errors                  > 1% of invocations   Failures
Duration                > 80% of timeout      Timeout risk
ConcurrentExecutions    > 80% of limit        Throttling risk
Throttles               > 0                   Capacity issue
IteratorAge (streams)   > 60 seconds          Processing lag
```

### X-Ray Tracing

```typescript
import { captureAWSv3Client } from 'aws-xray-sdk-core';
import { S3Client } from '@aws-sdk/client-s3';

// Wrap SDK clients for tracing
const s3 = captureAWSv3Client(new S3Client({}));

// Add custom subsegments
import AWSXRay from 'aws-xray-sdk-core';

export const handler = async (event) => {
  const segment = AWSXRay.getSegment();

  const subsegment = segment?.addNewSubsegment('processOrder');
  try {
    const result = await processOrder(event);
    subsegment?.close();
    return result;
  } catch (err) {
    subsegment?.addError(err);
    subsegment?.close();
    throw err;
  }
};
```

---

## Event Source Patterns

### API Gateway (HTTP API)

```typescript
// API Gateway HTTP API (recommended over REST API)
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Path parameters
  const { id } = event.pathParameters || {};

  // Query parameters
  const { page = '1' } = event.queryStringParameters || {};

  // Request body
  const body = event.body ? JSON.parse(event.body) : null;

  // Headers (lowercase in v2)
  const authHeader = event.headers['authorization'];

  // Request context
  const { requestId, http } = event.requestContext;
  console.log(`${http.method} ${http.path} - ${requestId}`);

  return {
    statusCode: 200,
    body: JSON.stringify({ id, page }),
  };
};
```

### SQS with Batch Processing

```typescript
import type { SQSHandler, SQSBatchResponse } from 'aws-lambda';

// Enable partial batch responses in function config
// "functionResponseTypes": ["ReportBatchItemFailures"]

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  await Promise.all(
    event.Records.map(async (record) => {
      try {
        await processMessage(JSON.parse(record.body));
      } catch (err) {
        console.error('Failed to process:', record.messageId, err);
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );

  // Return failed items for retry
  return { batchItemFailures };
};
```

### EventBridge with Filtering

```typescript
// EventBridge rule pattern (in infrastructure)
const eventPattern = {
  source: ['my.application'],
  'detail-type': ['OrderCreated'],
  detail: {
    status: ['paid'],
    amount: [{ numeric: ['>=', 100] }],
  },
};

// Handler
import type { EventBridgeHandler } from 'aws-lambda';

interface OrderEvent {
  orderId: string;
  status: string;
  amount: number;
}

export const handler: EventBridgeHandler<'OrderCreated', OrderEvent> = async (
  event
) => {
  const { orderId, amount } = event.detail;
  await notifyHighValueOrder(orderId, amount);
};
```

### S3 Event Processing

> For mounting S3 buckets as a filesystem inside Lambda (S3 Files), see the **s3** skill.

```typescript
import type { S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    // Only process ObjectCreated events
    if (!record.eventName.startsWith('ObjectCreated:')) continue;

    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(
      record.s3.object.key.replace(/\+/g, ' ')
    );

    // Skip non-matching keys
    if (!key.startsWith('uploads/')) continue;

    const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const content = await Body?.transformToString();

    await processUpload(key, content);
  }
};
```

### Scheduled Tasks (Cron)

```typescript
import type { ScheduledHandler } from 'aws-lambda';

// Schedule expressions:
// rate(5 minutes)
// rate(1 hour)
// cron(0 12 * * ? *)  - Daily at noon UTC
// cron(0 8 ? * MON-FRI *)  - Weekdays at 8am UTC

export const handler: ScheduledHandler = async (event) => {
  console.log('Scheduled execution:', event.time);

  // Run maintenance tasks
  await cleanupExpiredSessions();
  await sendDailyDigests();
  await refreshCaches();
};
```

---

## Security Best Practices

### IAM Least Privilege

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/my-table"
    },
    {
      "Effect": "Allow",
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:*:my-queue"
    }
  ]
}
```

### Secrets Management

```typescript
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const secrets = new SecretsManagerClient({});

// Cache secrets outside handler
let cachedSecrets: Record<string, string> | null = null;

async function getSecrets(): Promise<Record<string, string>> {
  if (cachedSecrets) return cachedSecrets;

  const { SecretString } = await secrets.send(
    new GetSecretValueCommand({ SecretId: 'my-app/production' })
  );

  cachedSecrets = JSON.parse(SecretString!);
  return cachedSecrets;
}

export const handler = async (event) => {
  const { DATABASE_URL, API_KEY } = await getSecrets();
  // Use secrets...
};
```

### VPC Configuration

```text
When to use VPC:
✅ Accessing RDS/ElastiCache in private subnet
✅ Compliance requirements (network isolation)
✅ Connecting to on-prem resources via Direct Connect

When to avoid VPC:
❌ Only accessing public AWS services (S3, DynamoDB, SQS)
❌ Latency-sensitive functions (VPC adds cold start time)
❌ Internet access needed (requires NAT Gateway, adds cost)

If using VPC:
- Use VPC endpoints for AWS services (no NAT needed)
- Place Lambda in private subnets
- NAT Gateway only if internet access truly required
```

### Input Validation

```typescript
import { z } from 'zod';

const OrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
  shippingAddress: z.object({
    line1: z.string().max(100),
    city: z.string().max(50),
    country: z.string().length(2),
  }),
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body || '{}');

  const result = OrderSchema.safeParse(body);
  if (!result.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Validation failed',
        details: result.error.flatten(),
      }),
    };
  }

  const order = result.data;
  // Process validated order...
};
```

---

## Cost Optimization

### Pricing Model

```text
Lambda pricing (us-east-1):
- Requests: $0.20 per 1M requests
- Duration: $0.0000166667 per GB-second (x86)
- Duration: $0.0000133334 per GB-second (ARM, 20% cheaper)

Free tier (monthly):
- 1M requests
- 400,000 GB-seconds
```

### Cost Estimation

```typescript
function estimateLambdaCost(params: {
  invocationsPerMonth: number;
  avgDurationMs: number;
  memoryMB: number;
  architecture?: 'x86' | 'arm64';
}) {
  const { invocationsPerMonth, avgDurationMs, memoryMB, architecture = 'arm64' } = params;

  const requestCost = (invocationsPerMonth / 1_000_000) * 0.20;

  const gbSeconds = (invocationsPerMonth * avgDurationMs / 1000) * (memoryMB / 1024);
  const durationRate = architecture === 'arm64' ? 0.0000133334 : 0.0000166667;
  const durationCost = gbSeconds * durationRate;

  // Subtract free tier
  const freeRequests = Math.min(invocationsPerMonth, 1_000_000);
  const freeGbSeconds = Math.min(gbSeconds, 400_000);

  return {
    requests: requestCost,
    duration: durationCost,
    freeRequestSavings: (freeRequests / 1_000_000) * 0.20,
    freeDurationSavings: freeGbSeconds * durationRate,
    total: Math.max(0, requestCost + durationCost - (freeRequests / 1_000_000) * 0.20 - freeGbSeconds * durationRate),
  };
}

// Example: 10M invocations, 200ms avg, 512MB, ARM
// → ~$15/month after free tier
```

### Optimization Checklist

```text
[ ] Use ARM architecture (20% cheaper)
[ ] Right-size memory (test with AWS Lambda Power Tuning)
[ ] Minimize bundle size (faster cold starts, less duration)
[ ] Use Provisioned Concurrency only where needed
[ ] Batch process where possible (fewer invocations)
[ ] Use SQS batch size > 1 for queue processing
[ ] Set appropriate timeouts (don't pay for idle time)
[ ] Use Savings Plans for predictable workloads
[ ] Delete unused functions
[ ] Monitor with Cost Explorer by function tag
```

---

## Local Development

### SAM Local

```bash
# Install SAM CLI
brew install aws-sam-cli

# Invoke function locally
sam local invoke MyFunction -e event.json

# Start local API
sam local start-api

# Run with debugger
sam local invoke --debug-port 5858
```

### Testing

```typescript
// Unit test with mocked AWS SDK
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { handler } from './handler';

const s3Mock = mockClient(S3Client);

beforeEach(() => {
  s3Mock.reset();
});

test('processes S3 object', async () => {
  s3Mock.on(GetObjectCommand).resolves({
    Body: { transformToString: () => Promise.resolve('file content') },
  });

  const event = {
    Records: [{
      s3: {
        bucket: { name: 'my-bucket' },
        object: { key: 'uploads/test.txt' },
      },
      eventName: 'ObjectCreated:Put',
    }],
  };

  await handler(event as any, {} as any, () => {});

  expect(s3Mock.calls()).toHaveLength(1);
});
```

---

## Troubleshooting

### Common Errors

```text
Task timed out after X seconds
- Increase timeout setting
- Check for blocking operations
- Verify VPC/NAT configuration if using VPC
- Check downstream service latency

Module not found
- Bundle dependencies correctly
- Check external modules configuration
- Verify layer contents

AccessDenied
- Check IAM role permissions
- Verify resource ARNs
- Check resource-based policies

ECONNREFUSED (VPC)
- Security group missing outbound rules
- No route to NAT Gateway
- VPC endpoint not configured
```

### Debugging Tips

```typescript
// Log context for debugging
export const handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify({
    functionName: context.functionName,
    functionVersion: context.functionVersion,
    memoryLimitInMB: context.memoryLimitInMB,
    remainingTimeMs: context.getRemainingTimeInMillis(),
  }));

  // ...
};
```

```bash
# Tail logs in real-time
aws logs tail /aws/lambda/my-function --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/my-function \
  --filter-pattern "ERROR"
```

---

## Quick Reference (Lambda)

```text
Handler Types:
- APIGatewayProxyHandlerV2  → HTTP API
- APIGatewayProxyHandler    → REST API
- SQSHandler                → SQS Queue
- S3Handler                 → S3 Events
- EventBridgeHandler        → EventBridge
- ScheduledHandler          → CloudWatch Events
- DynamoDBStreamHandler     → DynamoDB Streams
- KinesisStreamHandler      → Kinesis

Limits:
- Timeout: 15 minutes max
- Memory: 128MB - 10,240MB
- Package: 50MB zipped, 250MB unzipped
- /tmp: 512MB - 10,240MB
- Concurrent executions: 1,000 default (adjustable)
- Burst concurrency: 500-3000 (region-dependent)

Response Sizes:
- Synchronous: 6MB
- Asynchronous: 256KB payload

Cold Start Factors:
- Package size (biggest impact)
- VPC configuration
- Memory allocation
- Runtime
- Provisioned concurrency (eliminates cold starts)
```

---

# AWS CDK

Infrastructure as code for Lambda and serverless architectures using AWS Cloud Development Kit v2.

## CDK Philosophy

**Infrastructure IS code.** CDK uses TypeScript to define cloud resources with full IDE support, type safety, and the ability to share/reuse patterns. No YAML/JSON templates.

**Constructs are the building blocks.** L1 (raw CloudFormation), L2 (opinionated defaults), L3 (patterns combining multiple resources). Prefer L2/L3 for productivity.

**Synthesize, don't mutate.** CDK synthesizes CloudFormation templates. All decisions happen at synthesis time, not deploy time. Use TypeScript conditionals, not CloudFormation conditions.

---

## Project Structure

### Recommended Layout

```text
my-lambda-app/
├── bin/
│   └── app.ts                 # CDK app entry point
├── lib/
│   ├── stacks/
│   │   ├── api-stack.ts       # API Gateway + Lambda stack
│   │   └── database-stack.ts  # DynamoDB stack
│   ├── constructs/
│   │   ├── api-handler.ts     # Custom L3 construct
│   │   └── queue-processor.ts # Custom L3 construct
│   └── lambdas/               # Lambda handler code
│       ├── api/
│       │   └── handler.ts
│       └── processor/
│           └── handler.ts
├── test/
│   └── *.test.ts              # Infrastructure tests
├── cdk.json                   # CDK configuration
├── package.json               # Single file for CDK + runtime deps
└── tsconfig.json
```

### Key Principles

```typescript
// 1. Model with constructs, deploy with stacks
// Constructs = logical units, Stacks = deployment boundaries

// 2. Co-locate infrastructure and runtime code
// Lambda handlers live next to the construct that defines them

// 3. Separate stateful from stateless resources
// Stateful (databases) in protected stacks, stateless (compute) in replaceable stacks
```

---

## NodejsFunction Construct

The preferred way to define Lambda functions in CDK. Auto-transpiles TypeScript with esbuild.

### Basic Usage

```typescript
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';

// Convention-based: looks for my-construct.api.ts
const apiHandler = new NodejsFunction(this, 'api', {
  runtime: Runtime.NODEJS_20_X,
  architecture: Architecture.ARM_64,
  memorySize: 512,
  timeout: Duration.seconds(30),
});

// Explicit entry point
const processor = new NodejsFunction(this, 'processor', {
  entry: path.join(__dirname, '../lambdas/processor/handler.ts'),
  handler: 'main',  // exported function name, defaults to 'handler'
  runtime: Runtime.NODEJS_20_X,
  architecture: Architecture.ARM_64,
});
```

### Bundling Configuration

```typescript
new NodejsFunction(this, 'optimized-handler', {
  entry: path.join(__dirname, '../lambdas/api/handler.ts'),
  runtime: Runtime.NODEJS_20_X,
  architecture: Architecture.ARM_64,
  bundling: {
    // Minification & source maps
    minify: true,
    sourceMap: true,
    sourceMapMode: SourceMapMode.INLINE,

    // Target environment
    target: 'es2022',

    // External modules (already in Lambda runtime)
    externalModules: ['@aws-sdk/*'],

    // For native modules (requires Docker)
    nodeModules: ['sharp', 'bcrypt'],
    forceDockerBundling: true,  // Required for native deps

    // Environment replacement
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },

    // Custom esbuild args
    esbuildArgs: {
      '--tree-shaking': 'true',
    },
  },
});
```

### Environment Variables & Secrets

```typescript
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

const apiKey = Secret.fromSecretNameV2(this, 'ApiKey', 'my-api-key');
const configParam = StringParameter.fromStringParameterName(
  this, 'Config', '/my-app/config'
);

const handler = new NodejsFunction(this, 'handler', {
  entry: path.join(__dirname, '../lambdas/handler.ts'),
  environment: {
    // Non-sensitive configuration
    LOG_LEVEL: 'info',
    TABLE_NAME: table.tableName,  // Let CDK generate names
    // Reference secrets by ARN, fetch at runtime
    API_KEY_SECRET_ARN: apiKey.secretArn,
    CONFIG_PARAM_NAME: configParam.parameterName,
  },
});

// Grant read access to secrets
apiKey.grantRead(handler);
configParam.grantRead(handler);
```

---

## Construct Patterns

### L2 Constructs with Grants (Preferred)

```typescript
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Queue } from 'aws-cdk-lib/aws-sqs';

const table = new Table(this, 'Orders', {
  partitionKey: { name: 'pk', type: AttributeType.STRING },
  sortKey: { name: 'sk', type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,  // Protect data
});

const bucket = new Bucket(this, 'Uploads', {
  encryption: BucketEncryption.S3_MANAGED,
  removalPolicy: RemovalPolicy.RETAIN,
});

const queue = new Queue(this, 'ProcessingQueue', {
  visibilityTimeout: Duration.seconds(300),
  deadLetterQueue: {
    queue: new Queue(this, 'DLQ'),
    maxReceiveCount: 3,
  },
});

// Grant minimal permissions (CDK generates least-privilege IAM)
table.grantReadWriteData(handler);
bucket.grantRead(handler);
queue.grantSendMessages(handler);

// Pass resource identifiers via environment
handler.addEnvironment('TABLE_NAME', table.tableName);
handler.addEnvironment('BUCKET_NAME', bucket.bucketName);
handler.addEnvironment('QUEUE_URL', queue.queueUrl);
```

### Custom L3 Construct (Reusable Pattern)

```typescript
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export interface QueueProcessorProps {
  readonly entry: string;
  readonly batchSize?: number;
  readonly maxConcurrency?: number;
}

export class QueueProcessor extends Construct {
  public readonly queue: Queue;
  public readonly handler: NodejsFunction;
  public readonly dlq: Queue;

  constructor(scope: Construct, id: string, props: QueueProcessorProps) {
    super(scope, id);

    this.dlq = new Queue(this, 'DLQ', {
      retentionPeriod: Duration.days(14),
    });

    this.queue = new Queue(this, 'Queue', {
      visibilityTimeout: Duration.seconds(300),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3,
      },
    });

    this.handler = new NodejsFunction(this, 'Handler', {
      entry: props.entry,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      memorySize: 512,
      timeout: Duration.seconds(300),
      reservedConcurrentExecutions: props.maxConcurrency,
    });

    this.handler.addEventSource(new SqsEventSource(this.queue, {
      batchSize: props.batchSize ?? 10,
      reportBatchItemFailures: true,
    }));
  }
}

// Usage
const orderProcessor = new QueueProcessor(this, 'OrderProcessor', {
  entry: path.join(__dirname, '../lambdas/process-order/handler.ts'),
  batchSize: 5,
  maxConcurrency: 10,
});
```

---

## API Gateway Integration

### HTTP API (Recommended)

```typescript
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

const api = new HttpApi(this, 'Api', {
  corsPreflight: {
    allowOrigins: ['https://myapp.com'],
    allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST],
    allowHeaders: ['Content-Type', 'Authorization'],
  },
});

const getOrdersIntegration = new HttpLambdaIntegration(
  'GetOrders',
  getOrdersHandler
);

const createOrderIntegration = new HttpLambdaIntegration(
  'CreateOrder',
  createOrderHandler
);

api.addRoutes({
  path: '/orders',
  methods: [HttpMethod.GET],
  integration: getOrdersIntegration,
});

api.addRoutes({
  path: '/orders',
  methods: [HttpMethod.POST],
  integration: createOrderIntegration,
});

api.addRoutes({
  path: '/orders/{id}',
  methods: [HttpMethod.GET],
  integration: getOrderIntegration,
});
```

### REST API with Lambda Proxy

```typescript
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';

const api = new RestApi(this, 'Api', {
  deployOptions: {
    stageName: 'prod',
    throttlingBurstLimit: 100,
    throttlingRateLimit: 50,
  },
});

const orders = api.root.addResource('orders');
orders.addMethod('GET', new LambdaIntegration(listOrdersHandler));
orders.addMethod('POST', new LambdaIntegration(createOrderHandler));

const order = orders.addResource('{id}');
order.addMethod('GET', new LambdaIntegration(getOrderHandler));
```

---

## Event-Driven Patterns

### S3 Triggers

```typescript
import { S3EventSourceV2 } from 'aws-cdk-lib/aws-lambda-event-sources';

const bucket = new Bucket(this, 'Uploads');

const processor = new NodejsFunction(this, 'ImageProcessor', {
  entry: path.join(__dirname, '../lambdas/image-processor/handler.ts'),
});

processor.addEventSource(new S3EventSourceV2(bucket, {
  events: [EventType.OBJECT_CREATED],
  filters: [{ prefix: 'uploads/', suffix: '.jpg' }],
}));
```

### EventBridge Rules

```typescript
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

// Scheduled execution
new Rule(this, 'DailyCleanup', {
  schedule: Schedule.cron({ hour: '2', minute: '0' }),
  targets: [new LambdaFunction(cleanupHandler)],
});

// Event pattern matching
new Rule(this, 'OrderCreated', {
  eventPattern: {
    source: ['my.application'],
    detailType: ['OrderCreated'],
    detail: {
      status: ['paid'],
    },
  },
  targets: [new LambdaFunction(orderHandler)],
});
```

### DynamoDB Streams

```typescript
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';

const table = new Table(this, 'Orders', {
  partitionKey: { name: 'pk', type: AttributeType.STRING },
  stream: StreamViewType.NEW_AND_OLD_IMAGES,
});

streamProcessor.addEventSource(new DynamoEventSource(table, {
  startingPosition: StartingPosition.TRIM_HORIZON,
  batchSize: 100,
  bisectBatchOnError: true,
  retryAttempts: 3,
}));
```

---

## Stack Organization

### Separate Stateful and Stateless

```typescript
// bin/app.ts
const app = new App();

// Stateful stack - protected, rarely changed
const dataStack = new DataStack(app, 'DataStack', {
  env: { account: '123456789', region: 'us-east-1' },
  terminationProtection: true,  // Prevent accidental deletion
});

// Stateless stack - safely replaceable
const apiStack = new ApiStack(app, 'ApiStack', {
  env: { account: '123456789', region: 'us-east-1' },
  table: dataStack.ordersTable,  // Cross-stack reference
  bucket: dataStack.uploadsBucket,
});
```

### Environment Configuration

```typescript
// Configure via properties, NOT environment variables
interface EnvironmentConfig {
  readonly account: string;
  readonly region: string;
  readonly domainName?: string;
  readonly logRetention: RetentionDays;
  readonly enableAlarms: boolean;
}

const environments: Record<string, EnvironmentConfig> = {
  dev: {
    account: '111111111111',
    region: 'us-east-1',
    logRetention: RetentionDays.ONE_WEEK,
    enableAlarms: false,
  },
  prod: {
    account: '222222222222',
    region: 'us-east-1',
    domainName: 'api.myapp.com',
    logRetention: RetentionDays.ONE_YEAR,
    enableAlarms: true,
  },
};

// Make decisions at synthesis time
const stage = app.node.tryGetContext('stage') || 'dev';
const config = environments[stage];

new ApiStack(app, `Api-${stage}`, {
  env: { account: config.account, region: config.region },
  ...config,
});
```

---

## Security & Compliance

### cdk-nag for Automated Checks

```typescript
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';

const app = new App();
const stack = new MyStack(app, 'MyStack');

// Apply AWS Solutions security checks
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

// Suppress specific rules with justification
NagSuppressions.addStackSuppressions(stack, [
  {
    id: 'AwsSolutions-IAM4',
    reason: 'Using managed policy for CloudWatch Logs is acceptable',
  },
]);

// Suppress at resource level
NagSuppressions.addResourceSuppressions(
  myLambda,
  [{ id: 'AwsSolutions-L1', reason: 'Node 18 required for SDK compatibility' }],
  true  // Apply to children
);
```

### Custom Aspects for Compliance

```typescript
import { IAspect, Annotations } from 'aws-cdk-lib';
import { CfnFunction } from 'aws-cdk-lib/aws-lambda';

class LambdaSecurityAspect implements IAspect {
  visit(node: IConstruct): void {
    if (node instanceof CfnFunction) {
      // Enforce ARM architecture
      if (node.architectures?.[0] !== 'arm64') {
        Annotations.of(node).addWarning(
          'Lambda should use ARM64 for cost optimization'
        );
      }

      // Enforce memory limits
      const memory = node.memorySize || 128;
      if (memory > 3008) {
        Annotations.of(node).addError(
          'Lambda memory exceeds approved limit of 3008MB'
        );
      }

      // Enforce timeout limits
      const timeout = node.timeout || 3;
      if (timeout > 300) {
        Annotations.of(node).addWarning(
          'Lambda timeout exceeds 5 minutes - consider Step Functions'
        );
      }
    }
  }
}

// Apply to stack
Aspects.of(stack).add(new LambdaSecurityAspect());
```

### Least Privilege IAM

```typescript
// ✅ Use grant methods - CDK generates minimal permissions
table.grantReadWriteData(handler);
bucket.grantRead(handler);
queue.grantSendMessages(handler);

// ❌ Avoid broad permissions
handler.addToRolePolicy(new PolicyStatement({
  actions: ['dynamodb:*'],  // Too broad!
  resources: ['*'],         // Too broad!
}));

// ✅ If custom policy needed, be specific
handler.addToRolePolicy(new PolicyStatement({
  actions: ['ses:SendEmail'],
  resources: [`arn:aws:ses:${region}:${account}:identity/myapp.com`],
}));
```

---

## Testing CDK Applications

### Snapshot Tests

```typescript
import { Template } from 'aws-cdk-lib/assertions';
import { App } from 'aws-cdk-lib';

test('stack matches snapshot', () => {
  const app = new App();
  const stack = new MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  expect(template.toJSON()).toMatchSnapshot();
});
```

### Fine-Grained Assertions

```typescript
import { Template, Match } from 'aws-cdk-lib/assertions';

test('creates Lambda with correct configuration', () => {
  const app = new App();
  const stack = new MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  // Assert Lambda exists with properties
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs20.x',
    Architectures: ['arm64'],
    MemorySize: 512,
    Timeout: 30,
  });

  // Assert IAM policy grants
  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: Match.arrayWith(['dynamodb:GetItem', 'dynamodb:PutItem']),
        }),
      ]),
    },
  });
});
```

### Logical ID Stability Tests

```typescript
// Critical: Ensure stateful resource IDs don't change
test('stateful resource logical IDs are stable', () => {
  const app = new App();
  const stack = new DataStack(app, 'DataStack');
  const template = Template.fromStack(stack);

  // These IDs must never change (would cause resource replacement)
  expect(template.findResources('AWS::DynamoDB::Table')).toHaveProperty(
    'OrdersTable8A7D7F12'
  );
  expect(template.findResources('AWS::S3::Bucket')).toHaveProperty(
    'UploadsBucket4F81B48C'
  );
});
```

---

## CDK Pipelines (CI/CD)

### Basic Pipeline

```typescript
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';

const pipeline = new CodePipeline(this, 'Pipeline', {
  pipelineName: 'MyAppPipeline',
  synth: new ShellStep('Synth', {
    input: CodePipelineSource.gitHub('owner/repo', 'main'),
    commands: [
      'npm ci',
      'npm run build',
      'npm run test',
      'npx cdk synth',
    ],
  }),
  // Required for cross-account deployments
  crossAccountKeys: true,
});

// Add deployment stages
pipeline.addStage(new DeployStage(this, 'Dev', {
  env: { account: '111111111111', region: 'us-east-1' },
}));

pipeline.addStage(new DeployStage(this, 'Prod', {
  env: { account: '222222222222', region: 'us-east-1' },
}), {
  pre: [
    new ManualApprovalStep('PromoteToProd'),
  ],
});
```

### Cross-Account Bootstrap

```bash
# Bootstrap pipeline account
cdk bootstrap aws://PIPELINE_ACCOUNT/us-east-1

# Bootstrap target accounts with trust
cdk bootstrap aws://DEV_ACCOUNT/us-east-1 \
  --trust PIPELINE_ACCOUNT \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess

cdk bootstrap aws://PROD_ACCOUNT/us-east-1 \
  --trust PIPELINE_ACCOUNT \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

---

## CDK Best Practices Summary

### DO

```text
✅ Use NodejsFunction for TypeScript Lambda handlers
✅ Co-locate infrastructure and runtime code
✅ Use grant methods for IAM (grantRead, grantWrite, etc.)
✅ Let CDK generate resource names (no hardcoded names)
✅ Separate stateful and stateless resources into different stacks
✅ Enable termination protection on stateful stacks
✅ Commit cdk.context.json to version control
✅ Use cdk-nag for security/compliance checks
✅ Write tests that assert logical ID stability for stateful resources
✅ Configure via properties, not environment variables
✅ Make decisions at synthesis time (TypeScript conditionals)
✅ Model with constructs, deploy with stacks
```

### DON'T

```text
❌ Use hardcoded physical names (prevents multiple deployments)
❌ Look up environment variables inside constructs
❌ Change logical IDs of stateful resources (causes replacement)
❌ Rely solely on wrapper constructs for compliance
❌ Use CloudFormation conditions (use TypeScript instead)
❌ Mix stateful and stateless resources in same stack
❌ Skip cdk-nag or similar security scanning
❌ Deploy without testing template changes
❌ Use overly broad IAM permissions
❌ Forget removal policies on stateful resources
```

### Anti-Patterns

```typescript
// ❌ Environment variable lookups in constructs
export class MyConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const bucketName = process.env.BUCKET_NAME;  // Bad!
  }
}

// ✅ Configure via properties
export interface MyConstructProps {
  readonly bucketName: string;
}

export class MyConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MyConstructProps) {
    super(scope, id);
    const bucketName = props.bucketName;  // Good!
  }
}
```

```typescript
// ❌ Hardcoded names prevent re-deployment
const bucket = new Bucket(this, 'Bucket', {
  bucketName: 'my-app-bucket',  // Can't deploy twice!
});

// ✅ Generated names allow multiple deployments
const bucket = new Bucket(this, 'Bucket');
handler.addEnvironment('BUCKET_NAME', bucket.bucketName);
```

---

## CDK Quick Reference

```text
Commands:
- cdk init app --language typescript    Initialize new app
- cdk synth                             Synthesize CloudFormation
- cdk diff                              Show pending changes
- cdk deploy                            Deploy stack
- cdk deploy --hotswap                  Fast deploy (dev only)
- cdk destroy                           Delete stack
- cdk bootstrap                         Bootstrap account/region

Construct Levels:
- L1 (CfnXxx)   Raw CloudFormation, full control, verbose
- L2 (Xxx)      Intent-based, sensible defaults, grants
- L3 (patterns) Multi-resource patterns, opinionated

Key Imports:
- aws-cdk-lib                           Core CDK library
- aws-cdk-lib/aws-lambda-nodejs         NodejsFunction
- aws-cdk-lib/aws-lambda-event-sources  Event source mappings
- aws-cdk-lib/pipelines                 CDK Pipelines
- aws-cdk-lib/assertions                Testing utilities
- cdk-nag                               Security/compliance checks

NodejsFunction Runtimes:
- NODEJS_18_X   Includes @aws-sdk/* (v3)
- NODEJS_20_X   Recommended (LTS)
- NODEJS_22_X   Latest features
```
