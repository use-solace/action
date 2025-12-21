// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { define } from "../src/lib/runtime";

describe("Context Properties", () => {
  it("provides log.info and log.error", async () => {
    let infoCalled = false;
    let errorCalled = false;
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args: any[]) => {
      if (args[0] === "[action]" && args[1] === "info test") {
        infoCalled = true;
      }
      originalLog(...args);
    };
    console.error = (...args: any[]) => {
      if (args[0] === "[action]" && args[1] === "error test") {
        errorCalled = true;
      }
      originalError(...args);
    };
    const actions = define([
      {
        name: "log-test",
        description: "Test logging",
        execute: async (ctx) => {
          ctx.log.info("info test");
          ctx.log.error("error test");
        },
      },
    ]);
    await actions.run("log-test");
    console.log = originalLog;
    console.error = originalError;
    expect(infoCalled).toBe(true);
    expect(errorCalled).toBe(true);
  });

  it("provides bash utility", async () => {
    let bashAvailable = false;
    const actions = define([
      {
        name: "bash-test",
        description: "Test bash",
        execute: async (ctx) => {
          bashAvailable = ctx.bash !== undefined;
        },
      },
    ]);
    await actions.run("bash-test");
    expect(bashAvailable).toBe(true);
  });

  it("provides now() function that returns Date", async () => {
    let date: Date | null = null;
    const actions = define([
      {
        name: "now-test",
        description: "Test now",
        execute: async (ctx) => {
          date = ctx.now();
        },
      },
    ]);
    await actions.run("now-test");
    expect(date).toBeInstanceOf(Date);
    expect(date!.getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
  });

  it("provides state object", async () => {
    let stateReceived: any = null;
    const actions = define([
      {
        name: "state-test",
        description: "Test state",
        execute: async (ctx) => {
          stateReceived = ctx.state;
        },
      },
    ]);
    await actions.run("state-test");
    expect(stateReceived).toBeDefined();
    expect(typeof stateReceived).toBe("object");
  });
});

