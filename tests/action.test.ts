// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { define } from "../src/lib/runtime";
import { wait } from "./helpers";

describe("Action Definition and Execution", () => {
  it("defines an action and can run it manually", async () => {
    let ran = false;
    const actions = define([
      {
        name: "test-action",
        description: "A test action",
        execute: async () => {
          ran = true;
        },
      },
    ]);
    await actions.run("test-action");
    expect(ran).toBe(true);
  });

  it("executes action with context", async () => {
    let receivedContext: any = null;
    const actions = define([
      {
        name: "context-test",
        description: "Test context",
        execute: async (ctx) => {
          receivedContext = ctx;
        },
      },
    ]);
    await actions.run("context-test");
    expect(receivedContext).not.toBeNull();
    expect(receivedContext.log).toBeDefined();
    expect(receivedContext.log.info).toBeDefined();
    expect(receivedContext.log.error).toBeDefined();
    expect(receivedContext.bash).toBeDefined();
    expect(receivedContext.now).toBeDefined();
    expect(receivedContext.state).toBeDefined();
  });

  it("supports synchronous execute function", async () => {
    let ran = false;
    const actions = define([
      {
        name: "sync-action",
        description: "Synchronous action",
        execute: () => {
          ran = true;
        },
      },
    ]);
    await actions.run("sync-action");
    expect(ran).toBe(true);
  });

  it("supports async execute function", async () => {
    let ran = false;
    const actions = define([
      {
        name: "async-action",
        description: "Async action",
        execute: async () => {
          await wait(10);
          ran = true;
        },
      },
    ]);
    await actions.run("async-action");
    expect(ran).toBe(true);
  });

  it("throws error for unknown action name", async () => {
    const actions = define([
      {
        name: "known-action",
        description: "Known action",
        execute: async () => {},
      },
    ]);
    await expect(actions.run("unknown-action")).rejects.toThrow(
      "Unknown action: unknown-action"
    );
  });
});
