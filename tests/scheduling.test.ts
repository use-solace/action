// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { define } from "../src/lib/runtime";
import { wait } from "./helpers";

describe("Scheduled Execution", () => {
  it("schedules action with interval", async () => {
    let executionCount = 0;
    const actions = define([
      {
        name: "scheduled-action",
        description: "Scheduled action",
        interval: { every: 1, unit: "seconds" },
        execute: async () => {
          executionCount++;
        },
      },
    ]);
    // Wait for scheduled execution
    await wait(1500);
    expect(executionCount).toBeGreaterThan(0);
  });

  it("supports different interval units", async () => {
    const actions = define([
      {
        name: "seconds-action",
        description: "Seconds interval",
        interval: { every: 1, unit: "seconds" },
        execute: async () => {},
      },
      {
        name: "minutes-action",
        description: "Minutes interval",
        interval: { every: 1, unit: "minutes" },
        execute: async () => {},
      },
      {
        name: "hours-action",
        description: "Hours interval",
        interval: { every: 1, unit: "hours" },
        execute: async () => {},
      },
      {
        name: "days-action",
        description: "Days interval",
        interval: { every: 1, unit: "days" },
        execute: async () => {},
      },
    ]);
    // Just verify they can be defined without errors
    expect(actions).toBeDefined();
  });

  it("defaults to minutes when unit is not specified", async () => {
    let executionCount = 0;
    const actions = define([
      {
        name: "default-interval",
        description: "Default interval",
        interval: { every: 1 },
        execute: async () => {
          executionCount++;
        },
      },
    ]);
    // Should use minutes as default
    await wait(500); // Should not execute in 500ms if using minutes
    expect(executionCount).toBe(0);
  });

  it("supports actions without intervals (manual only)", async () => {
    let executionCount = 0;
    const actions = define([
      {
        name: "manual-only",
        description: "Manual only action",
        execute: async () => {
          executionCount++;
        },
      },
    ]);
    // Should not execute automatically
    await wait(500);
    expect(executionCount).toBe(0);
    // Should execute when manually triggered
    await actions.run("manual-only");
    expect(executionCount).toBe(1);
  });
});

