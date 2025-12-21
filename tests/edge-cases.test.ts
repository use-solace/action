// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { define } from "../src/lib/runtime";
import { wait } from "./helpers";

describe("Edge Cases", () => {
  it("handles very short intervals", async () => {
    let executionCount = 0;
    const actions = define([
      {
        name: "short-interval",
        description: "Short interval",
        interval: { every: 1, unit: "seconds" },
        execute: async () => {
          executionCount++;
        },
      },
    ]);
    // Wait longer to ensure the scheduled execution happens
    // Action is scheduled 1 second after definition, so wait 2.5 seconds
    await wait(2500);
    expect(executionCount).toBeGreaterThan(0);
  });

  it("handles actions that take longer than interval", async () => {
    let executionCount = 0;
    const actions = define([
      {
        name: "long-running",
        description: "Long running action",
        interval: { every: 1, unit: "seconds" },
        execute: async () => {
          executionCount++;
          await wait(2000); // Longer than interval
        },
      },
    ]);
    await wait(3500);
    // Should have executed at least once, but not too many times due to concurrency control
    expect(executionCount).toBeGreaterThan(0);
    expect(executionCount).toBeLessThan(5);
  });

  it("handles rapid manual executions", async () => {
    let executionCount = 0;
    const actions = define([
      {
        name: "rapid-exec",
        description: "Rapid execution",
        execute: async () => {
          executionCount++;
        },
      },
    ]);
    // Run sequentially to avoid concurrency control skipping executions
    await actions.run("rapid-exec");
    await actions.run("rapid-exec");
    await actions.run("rapid-exec");
    // All three should execute when run sequentially
    expect(executionCount).toBe(3);
  });

  it("handles empty action array", async () => {
    const actions = define([]);
    expect(actions).toBeDefined();
    await expect(actions.run("any")).rejects.toThrow("Unknown action: any");
  });

  it("handles actions with all hooks", async () => {
    const executionOrder: string[] = [];
    const actions = define([
      {
        name: "all-hooks",
        description: "All hooks",
        execute: async () => {
          executionOrder.push("execute");
        },
        onRun: async () => {
          executionOrder.push("onRun");
        },
        onComplete: async () => {
          executionOrder.push("onComplete");
        },
        onError: async () => {
          executionOrder.push("onError");
        },
      },
    ]);
    await actions.run("all-hooks");
    expect(executionOrder).toEqual(["execute", "onRun", "onComplete"]);
    expect(executionOrder).not.toContain("onError");
  });

  it("handles actions with all hooks and error", async () => {
    const executionOrder: string[] = [];
    const actions = define([
      {
        name: "all-hooks-error",
        description: "All hooks with error",
        execute: async () => {
          executionOrder.push("execute");
          throw new Error("Test error");
        },
        onRun: async () => {
          executionOrder.push("onRun");
        },
        onComplete: async () => {
          executionOrder.push("onComplete");
        },
        onError: async () => {
          executionOrder.push("onError");
        },
      },
    ]);
    await actions.run("all-hooks-error");
    expect(executionOrder).toEqual(["execute", "onError"]);
    expect(executionOrder).not.toContain("onRun");
    expect(executionOrder).not.toContain("onComplete");
  });
});

