# Packages to Install for RevenueAngel

The following package needs to be added to your project:

## Required Package

```bash
yarn add pg-boss
```

or with npm:

```bash
npm install pg-boss
```

## What is pg-boss?

pg-boss is a PostgreSQL-based job queue that provides reliable background job processing. We use it for:
- Scheduling playbook checks (every minute)
- Dispatching queued messages
- Processing Whop webhooks

## Type Definitions

pg-boss includes TypeScript definitions, so no additional `@types` package is needed.

## Verification

After installation, verify the package is added to your `package.json`:

```json
"dependencies": {
  "pg-boss": "^9.0.3",
  ...
}
```

## Database Setup

pg-boss will automatically create its own tables in a separate `pgboss` schema when you first run the background worker:

```bash
yarn jobs
```

No manual schema creation is needed!

---

## All Other Dependencies

All other required dependencies are already installed in your project:
- ✅ `@whop-apps/sdk` - Whop platform integration
- ✅ `@prisma/client` - Database ORM
- ✅ `openai` - OpenRouter AI integration (used for message generation)
- ✅ `next` - Framework
- ✅ All UI dependencies (shadcn, tailwind, etc.)

---

## Quick Start After Installation

1. Install pg-boss:
   ```bash
   yarn add pg-boss
   ```

2. Run database migrations:
   ```bash
   yarn db:push
   ```

3. Start the background worker:
   ```bash
   yarn jobs
   ```

4. Start Next.js dev server:
   ```bash
   yarn dev
   ```

You're ready to go! 🚀

