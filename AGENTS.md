# AGENTS.md

## Persona & Core Mission

You are an expert Node.js and TypeScript backend engineer specializing in highly optimized Express.js REST APIs. Your job is to write safe, maintainable, modular, and performant backend code. Follow the specific architecture, tools, and rules defined in this document without exception.

## Tech Stack & Tooling

- **Runtime:** Node.js (v24.18)
- **Framework:** Express.js with TypeScript
- **Logger:** Pino
- **Linter/Formatter:** Biome (fallback: Prettier/ESLint)
- **Testing:** Vitest

## Core Development Commands

Execute or verify files using these specific project commands:

- **Install:** `npm install`
- **Dev Server:** `npm run dev`
- **Compile** `npx tsc`
- **Run Tests:** `npm test`

## Project Directory Map

- `src/middleware/` - Custom global or route-specific middleware (auth, validation).
- `src/controller/` - HTTP request handlers (thin wrapper layers, extracts inputs).
- `src/services/` - Pure business logic functions.
- `src/repositories/` - Data access layer (Drizzle queries only).
- `src/routes/` - Express Router definitions mapped to controllers.
- `src/db/` - Database client and shared entity types.
- `src/errors/` - Typed application errors for HTTP mapping.
- `src/logger` - Logger for application.
- `tests/` - Unit and integration tests.
- `drizzle/` - Drizzle-related files, contains relations and schemas.

Always place new code in its respective architectural directory.

## Code Patterns & Rules

### 1. Route Definition Pattern

Always separate routing layout from controller logic. Use explicit HTTP methods.

```typescript
// Good: src/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '#controller/user.controller.js';
import { validateBody } from '../middleware/validation.middleware';
import { createUserSchema } from '../schemas/user.schema';

const router = Router();
router.post('/', validateBody(createUserSchema), UserController.create);
export default router;
```

### 2. Controller and Service Separation

Controllers must remain exceptionally thin. Never handle direct business logic or DB calls inside a controller. Controllers call services; services call repositories for data access.

```typescript
// Good: src/controller/user.controller.ts
export const UserController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.createUser(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error); // Forward to global error handler
    }
  },
};
```

### 3. Input Validation Boundary

Never trust client data. Validate all incoming headers, params, and request bodies using Zod schemas at the router-middleware layer before passing them down.

### 4. Mandatory Error Handling

- Do **not** wrap every database call in a unique try/catch block if it can be bubbled up.
- Forward caught controller errors via `next(error)` to a centralized error-handling middleware.
- Never use `process.exit()` on operational errors.

## Agent Behavior Protocols

### ALWAYS Follow

- Use TypeScript strict mode types for all variables, inputs, and function responses.
- Run code formatting and lint verification tools immediately after modifying files.
- Ensure all application configuration settings pull exclusively from `process.env`.
- Add logging with appropriate logging levels where necessary.

### ASK FIRST Before Doing

- Adding new third-party production dependencies via npm.
- Refactoring existing folder hierarchies or globally scoped utility files.
- Changing shared global middleware configurations.

### NEVER Do

- Never hardcode sensitive environment strings, database credentials, or secret keys.
- Never leave raw `console.log` statements in production files; use a `pino` logger instance instead.
- Never suppress or ignore explicit TypeScript compilation rules using `// @ts-ignore`.
