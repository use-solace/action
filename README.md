# @use-solace/action

A TypeScript library for defining and running typesafe scheduled actions (cron jobs). Build reliable, type-safe automation with built-in scheduling, logging, and shell command execution.

## Features

- **Type-safe**: Full TypeScript support with strict type checking
- **Scheduled execution**: Automatic interval-based scheduling with configurable units
- **Manual execution**: Run actions on-demand via API
- **Concurrency control**: Prevents duplicate execution of the same action
- **Error handling**: Built-in error logging and recovery
- **Bash integration**: Execute shell commands from within actions
- **Runtime validation**: Schema validation using Zod
- **Structured logging**: Built-in logging via action context
- **State management**: Per-action state persistence
- **ESM support**: Native ES modules

## Installation

```bash
# bun
bun add @use-solace/action
# npm
npm install @use-solace/action
# yarn
yarn add @use-solace/action
# pnpm
pnpm add @use-solace/action
```

## Quick Start

```typescript
import { define } from "@use-solace/action";

const actions = define([
  {
    name: "cleanup-logs",
    description: "Clean up old log files",
    interval: { every: 1, unit: "hours" },
    execute: async (ctx) => {
      ctx.log.info("Starting cleanup...");
      // Your action logic here
      ctx.log.info("Cleanup complete");
    },
  },
]);

// Actions run automatically on their schedule
// Or trigger manually:
await actions.run("cleanup-logs");
```

## API Reference

### `define(definitions: ActionDefinition[])`

Registers one or more action definitions and starts the scheduler. Returns an object with a `run` method for manual execution.

**Parameters:**

- `definitions`: An array of `ActionDefinition` objects

**Returns:**

```typescript
{
  run: (name: string) => Promise<void>;
}
```

**Throws:**

- `Error` if any action definition is invalid (schema validation fails)
- `Error` if duplicate action names are found

**Example:**

```typescript
const actions = define([
  {
    name: "my-action",
    description: "My action description",
    execute: async (ctx) => {
      /* ... */
    },
  },
]);
```

### `ActionDefinition`

The interface for defining an action.

```typescript
interface ActionDefinition {
  name: string; // Unique identifier for the action
  description: string; // Human-readable description
  execute: (ctx: ActionContext) => Promise<void> | void; // Main execution function
  onRun?: (ctx: ActionContext) => Promise<void> | void; // Optional hook that runs once on first execution
  onComplete?: (ctx: ActionContext) => Promise<void> | void; // Optional hook that runs on every successful completion
  onError?: (ctx: ActionContext, error: Error) => Promise<void> | void; // Optional hook that runs on execution failure
  interval?: ActionInterval; // Optional scheduling interval
}
```

**Properties:**

- **`name`** (required): A unique string identifier for the action. Used to reference the action when calling `actions.run()`.

- **`description`** (required): A human-readable description of what the action does.

- **`execute`** (required): The main function that performs the action's work. Receives an `ActionContext` object with utilities and can be async or sync.

- **`onRun`** (optional): A callback function that runs after `execute` completes successfully on the **first execution only**. Useful for one-time setup, initialization, or first-run notifications.

- **`onComplete`** (optional): A callback function that runs after `execute` completes successfully on **every execution**. Useful for notifications, logging, or cleanup that should happen after each successful run.

- **`onError`** (optional): A callback function that runs when `execute` throws an error. Receives the context and the error object. Useful for error handling, notifications, cleanup, or recovery logic.

- **`interval`** (optional): Defines when the action should run automatically. If omitted, the action will only run when manually triggered.

### `ActionInterval`

Defines the scheduling interval for an action.

```typescript
interface ActionInterval {
  every: number; // Number of units (must be positive integer)
  unit?: IntervalUnit; // Unit of time (defaults to 'minutes')
}

type IntervalUnit = "seconds" | "minutes" | "hours" | "days";
```

**Properties:**

- **`every`**: A positive integer specifying how many units to wait between executions.
- **`unit`**: The time unit. Options are:
  - `'seconds'`: Run every N seconds
  - `'minutes'`: Run every N minutes (default)
  - `'hours'`: Run every N hours
  - `'days'`: Run every N days

**Examples:**

```typescript
{ every: 30, unit: 'seconds' }  // Every 30 seconds
{ every: 5, unit: 'minutes' }    // Every 5 minutes
{ every: 1, unit: 'hours' }      // Every hour
{ every: 1 }                     // Every 1 minute (default unit)
```

### `ActionContext`

The context object passed to action execution functions, providing utilities and state.

```typescript
interface ActionContext {
  log: {
    info: (message: string) => void;
    error: (message: string) => void;
  };
  bash?: {
    run: (cmd: string, opts?: BashOptions) => Promise<BashResult>;
  };
  now: () => Date;
  state?: any;
}
```

**Properties:**

- **`log`**: Structured logging utilities
  - `log.info(message)`: Log an informational message (prefixed with `[action]`)
  - `log.error(message)`: Log an error message (prefixed with `[action]`)

- **`bash`**: Optional bash command execution utility (see [Bash Utilities](#bash-utilities))

- **`now()`**: Returns the current date/time as a `Date` object

- **`state`**: Optional state object that persists across action executions (currently initialized as empty object)

### Bash Utilities

The `bash` utility allows you to execute shell commands from within your actions.

#### `bash.run(command, options?)`

Executes a shell command and returns the result.

**Parameters:**

- `command`: The shell command to execute (string)
- `options` (optional):
  ```typescript
  {
    cwd?: string;                    // Working directory
    env?: Record<string, string>;  // Environment variables (merged with process.env)
  }
  ```

**Returns:**

```typescript
Promise<{
  exitCode: number; // Process exit code (0 for success)
  stdout: string; // Standard output
  stderr: string; // Standard error
}>;
```

**Example:**

```typescript
const result = await ctx.bash?.run("ls -la", { cwd: "/tmp" });
if (result.exitCode === 0) {
  ctx.log.info(`Files: ${result.stdout}`);
} else {
  ctx.log.error(`Command failed: ${result.stderr}`);
}
```

## Examples

### Basic Scheduled Action

```typescript
import { define } from "@use-solace/action";

const actions = define([
  {
    name: "health-check",
    description: "Check system health every 5 minutes",
    interval: { every: 5, unit: "minutes" },
    execute: async (ctx) => {
      ctx.log.info("Running health check...");
      // Perform health check logic
      const isHealthy = await checkSystemHealth();
      if (!isHealthy) {
        ctx.log.error("System health check failed!");
      } else {
        ctx.log.info("System is healthy");
      }
    },
  },
]);
```

### Action with Post-Execution Hooks

```typescript
const actions = define([
  {
    name: "backup-database",
    description: "Backup database every 6 hours",
    interval: { every: 6, unit: "hours" },
    execute: async (ctx) => {
      ctx.log.info("Starting database backup...");
      // Perform backup
      await performBackup();
      ctx.log.info("Backup completed");
    },
    onRun: async (ctx) => {
      // This runs only once on the first execution
      ctx.log.info("Sending initial backup notification...");
      await sendNotification("Backup system initialized");
    },
    onComplete: async (ctx) => {
      // This runs after every successful execution
      ctx.log.info("Sending completion notification...");
      await sendNotification("Backup completed successfully");
    },
  },
]);
```

### Action with Bash Commands

```typescript
const actions = define([
  {
    name: "cleanup-temp",
    description: "Clean temporary files every hour",
    interval: { every: 1, unit: "hours" },
    execute: async (ctx) => {
      ctx.log.info("Cleaning temporary files...");

      const result = await ctx.bash?.run(
        "find /tmp -type f -mtime +7 -delete",
        {
          env: { TMPDIR: "/tmp" },
        }
      );

      if (result?.exitCode === 0) {
        ctx.log.info("Temporary files cleaned successfully");
      } else {
        ctx.log.error(`Cleanup failed: ${result?.stderr}`);
      }
    },
  },
]);
```

### Manual-Only Action (No Schedule)

```typescript
const actions = define([
  {
    name: "migrate-database",
    description: "Run database migrations",
    // No interval - only runs when manually triggered
    execute: async (ctx) => {
      ctx.log.info("Running database migrations...");
      await runMigrations();
      ctx.log.info("Migrations completed");
    },
  },
]);

// Trigger manually
await actions.run("migrate-database");
```

### Multiple Actions

```typescript
const actions = define([
  {
    name: "sync-data",
    description: "Sync data every 15 minutes",
    interval: { every: 15, unit: "minutes" },
    execute: async (ctx) => {
      await syncData();
    },
  },
  {
    name: "generate-report",
    description: "Generate daily report",
    interval: { every: 1, unit: "days" },
    execute: async (ctx) => {
      await generateReport();
    },
  },
  {
    name: "monitor-logs",
    description: "Monitor logs every 30 seconds",
    interval: { every: 30, unit: "seconds" },
    execute: async (ctx) => {
      await monitorLogs();
    },
  },
]);
```

### Error Handling

Actions have built-in error handling. Errors in `execute` or `onRun` are automatically caught and logged:

```typescript
const actions = define([
  {
    name: "risky-operation",
    description: "An action that might fail",
    interval: { every: 1, unit: "hours" },
    execute: async (ctx) => {
      // If this throws, it's automatically caught and logged
      await someRiskyOperation();
    },
  },
]);
```

Errors are logged with the format: `[action] action <name> failed: <error message>`

### Action with Error Handler

Use `onError` to handle failures with custom logic:

```typescript
const actions = define([
  {
    name: "critical-task",
    description: "A task that needs error handling",
    interval: { every: 30, unit: "minutes" },
    execute: async (ctx) => {
      await performCriticalTask();
    },
    onError: async (ctx, error) => {
      // Custom error handling
      ctx.log.error(`Critical task failed: ${error.message}`);
      await sendAlert(`Action failed: ${error.message}`);
      await attemptRecovery();
    },
  },
]);
```

The `onError` handler receives both the context and the error object, allowing you to implement custom error handling, notifications, or recovery logic. If `onError` itself throws an error, it will be caught and logged separately.

### Action with Completion Handler

Use `onComplete` to run logic after every successful execution:

```typescript
const actions = define([
  {
    name: "sync-data",
    description: "Sync data every 15 minutes",
    interval: { every: 15, unit: "minutes" },
    execute: async (ctx) => {
      await syncData();
    },
    onComplete: async (ctx) => {
      // This runs after every successful execution
      ctx.log.info("Data sync completed successfully");
      await updateLastSyncTime();
      await notifyTeam("Data sync completed");
    },
  },
]);
```

The `onComplete` handler runs after every successful execution (unlike `onRun` which only runs once). This is useful for notifications, logging, or cleanup that should happen after each successful run. If `onComplete` itself throws an error, it will be caught and logged separately.

## Advanced Usage

### Type Safety

The library is fully typed. Import types for better IDE support:

```typescript
import {
  define,
  type ActionDefinition,
  type ActionContext,
} from "@use-solace/action";

const myAction: ActionDefinition = {
  name: "typed-action",
  description: "A fully typed action",
  execute: async (ctx: ActionContext) => {
    // ctx is fully typed
    ctx.log.info("Hello");
  },
};
```

### Concurrency Control

The scheduler automatically prevents concurrent execution of the same action. If an action is still running when its next scheduled time arrives, it will be skipped until the current execution completes.

```typescript
const actions = define([
  {
    name: "long-running-task",
    description: "A task that might take longer than the interval",
    interval: { every: 1, unit: "minutes" },
    execute: async (ctx) => {
      // If this takes 2 minutes, the next scheduled run will be skipped
      await longRunningOperation();
    },
  },
]);
```

### Scheduler Behavior

- The scheduler checks every 1 second for actions that need to run
- Actions are scheduled to run at `Date.now() + interval` after registration
- After each execution, the next run time is recalculated based on the interval
- The scheduler starts automatically when `define()` is called

### State Management

The `state` property in `ActionContext` can be used to persist data across executions (currently initialized as an empty object):

```typescript
const actions = define([
  {
    name: "counter",
    description: "Count executions",
    interval: { every: 1, unit: "minutes" },
    execute: async (ctx) => {
      ctx.state.count = (ctx.state.count || 0) + 1;
      ctx.log.info(`Executed ${ctx.state.count} times`);
    },
  },
]);
```

## Development

### Building

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Type Checking

```bash
npm run typecheck
```

Runs TypeScript compiler in check-only mode (no output files).

### Testing

```bash
npm test
# or
bun test
```

Runs the test suite using Bun's test framework.

## Requirements

- Node.js 18+ or Bun
- TypeScript 5.3+ (for development)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or contributions, please visit: [github.com/use-solace](https://github.com/use-solace)
