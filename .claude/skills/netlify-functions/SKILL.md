---
name: netlify-functions
description: Guide for Netlify Functions (serverless). Use when creating API endpoints, server-side routes, background tasks, or scheduled jobs on Netlify. Covers modern syntax, routing, background functions, scheduled functions, and streaming.
---

# Netlify Functions

Serverless functions that run on Netlify's infrastructure. Use for API endpoints, server-side logic, background processing, and scheduled tasks.

```bash
# Functions live in netlify/functions/ by default
```

## Modern Syntax (Preferred)

Use default exports with Web API `Request`/`Response`:

```typescript
import type { Config, Context } from "@netlify/functions";

export default async function handler(req: Request, context: Context) {
  const body = await req.json();
  return Response.json({ message: "Hello", data: body });
}

export const config: Config = {
  path: "/api/hello",
};
```

## Routing

```typescript
// Single path
export const config: Config = {
  path: "/api/users",
};

// Path parameters
export const config: Config = {
  path: "/api/users/:id",
};

// HTTP method filter
export const config: Config = {
  path: "/api/items",
  method: ["GET", "POST"],
};

// Multiple paths
export const config: Config = {
  path: ["/api/v1/items", "/api/v2/items"],
};
```

Default path (no config): `/.netlify/functions/{filename}`

## Context Object

```typescript
export default async function handler(req: Request, context: Context) {
  context.geo;        // { city, country, subdivision, latitude, longitude }
  context.ip;         // Client IP string
  context.site;       // { id, name, url }
  context.deploy;     // { id, context, published }
  context.cookies;    // Cookie helpers
  context.requestId;  // Unique request ID

  // Use Netlify.env for environment variables (not process.env)
  const key = Netlify.env.get("API_KEY");

  return new Response("OK");
}
```

## Background Functions

Long-running tasks (up to 15 minutes). Client gets immediate `202` response.

```typescript
// File: netlify/functions/process-data-background.ts
export default async function handler(req: Request) {
  const data = await req.json();
  // Do long processing...
  await processLargeDataset(data);
  // No need to return a response — background functions don't send one
}

export const config: Config = {
  path: "/api/process-data",
};
```

Name the file with `-background` suffix OR export config with `type: "background"`.

## Scheduled Functions

Run on a cron schedule. Only run on published deploys.

```typescript
import type { Config } from "@netlify/functions";

export default async function handler() {
  await cleanupOldRecords();
}

export const config: Config = {
  schedule: "@daily",          // or cron: "0 9 * * 1" (Mon 9am)
};
```

Or configure in `netlify.toml`:
```toml
[functions."cleanup"]
schedule = "@daily"
```

## Streaming Responses

```typescript
export default async function handler(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of data) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  });
}
```

Max streaming payload: 20 MB. Max buffered: 6 MB.

## Resource Limits

| Limit | Value |
|---|---|
| Synchronous timeout | 60 seconds |
| Background timeout | 15 minutes |
| Memory | 1 GB |
| Buffered payload | 6 MB |
| Streaming payload | 20 MB |
| Scheduled timeout | 30 seconds |

## Organization

```
netlify/
  functions/
    api-users.ts           # Handler for /api/users
    _shared/               # Shared utilities (underscore = not deployed)
      db.ts
      auth.ts
```
