// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { define } from "../src/lib/runtime";
import { wait } from "./helpers";

describe("Concurrency Control", () => {
  it("prevents concurrent execution of the same action", async () => {
    let concurrentExecutions = 0;
    let maxConcurrent = 0;
    const actions = define([
      {
        name: "concurrency-test",
        description: "Test concurrency",
        interval: { every: 1, unit: "seconds" },
        execute: async () => {
          concurrentExecutions++;
          maxConcurrent = Math.max(maxConcurrent, concurrentExecutions);
          await wait(2000); // Longer than interval
          concurrentExecutions--;
        },
      },
    ]);
    await wait(3500);
    // Should never have more than 1 concurrent execution
    expect(maxConcurrent).toBeLessThanOrEqual(1);
  });

  it("allows concurrent execution of different actions", async () => {
    let action1Running = false;
    let action2Running = false;
    let bothRunning = false;
    const actions = define([
      {
        name: "action-1",
        description: "Action 1",
        execute: async () => {
          action1Running = true;
          if (action2Running) bothRunning = true;
          await wait(50);
          action1Running = false;
        },
      },
      {
        name: "action-2",
        description: "Action 2",
        execute: async () => {
          action2Running = true;
          if (action1Running) bothRunning = true;
          await wait(50);
          action2Running = false;
        },
      },
    ]);
    // Run both simultaneously
    await Promise.all([actions.run("action-1"), actions.run("action-2")]);
    expect(bothRunning).toBe(true);
  });
});

