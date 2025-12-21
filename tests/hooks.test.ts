// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { define } from "../src/lib/runtime";

describe("Action Hooks", () => {
  it("executes onRun only once on first execution", async () => {
    let executeCount = 0;
    let onRunCount = 0;
    const actions = define([
      {
        name: "onrun-test",
        description: "Test onRun",
        execute: async () => {
          executeCount++;
        },
        onRun: async () => {
          onRunCount++;
        },
      },
    ]);
    // First execution
    await actions.run("onrun-test");
    expect(executeCount).toBe(1);
    expect(onRunCount).toBe(1);
    // Second execution
    await actions.run("onrun-test");
    expect(executeCount).toBe(2);
    expect(onRunCount).toBe(1); // Should still be 1
    // Third execution
    await actions.run("onrun-test");
    expect(executeCount).toBe(3);
    expect(onRunCount).toBe(1); // Should still be 1
  });

  it("executes onComplete on every successful execution", async () => {
    let executeCount = 0;
    let onCompleteCount = 0;
    const actions = define([
      {
        name: "oncomplete-test",
        description: "Test onComplete",
        execute: async () => {
          executeCount++;
        },
        onComplete: async () => {
          onCompleteCount++;
        },
      },
    ]);
    await actions.run("oncomplete-test");
    expect(executeCount).toBe(1);
    expect(onCompleteCount).toBe(1);
    await actions.run("oncomplete-test");
    expect(executeCount).toBe(2);
    expect(onCompleteCount).toBe(2);
    await actions.run("oncomplete-test");
    expect(executeCount).toBe(3);
    expect(onCompleteCount).toBe(3);
  });

  it("executes onRun before onComplete on first execution", async () => {
    const executionOrder: string[] = [];
    const actions = define([
      {
        name: "hook-order-test",
        description: "Test hook order",
        execute: async () => {
          executionOrder.push("execute");
        },
        onRun: async () => {
          executionOrder.push("onRun");
        },
        onComplete: async () => {
          executionOrder.push("onComplete");
        },
      },
    ]);
    await actions.run("hook-order-test");
    expect(executionOrder).toEqual(["execute", "onRun", "onComplete"]);
  });

  it("does not execute onComplete when action fails", async () => {
    let onCompleteCalled = false;
    let onErrorCalled = false;
    const actions = define([
      {
        name: "error-test",
        description: "Test error handling",
        execute: async () => {
          throw new Error("Test error");
        },
        onComplete: async () => {
          onCompleteCalled = true;
        },
        onError: async () => {
          onErrorCalled = true;
        },
      },
    ]);
    await actions.run("error-test");
    expect(onCompleteCalled).toBe(false);
    expect(onErrorCalled).toBe(true);
  });

  it("executes onError when action throws an error", async () => {
    let onErrorCalled = false;
    let receivedError: Error | null = null;
    const actions = define([
      {
        name: "onerror-test",
        description: "Test onError",
        execute: async () => {
          throw new Error("Test error message");
        },
        onError: async (ctx, error: Error) => {
          onErrorCalled = true;
          receivedError = error;
        },
      },
    ]);
    await actions.run("onerror-test");
    expect(onErrorCalled).toBe(true);
    expect(receivedError).not.toBeNull();
    expect(receivedError!.message).toBe("Test error message");
  });

  it("converts non-Error values to Error in onError", async () => {
    let receivedError: Error | null = null;
    const actions = define([
      {
        name: "non-error-test",
        description: "Test non-Error throw",
        execute: async () => {
          throw "String error";
        },
        onError: async (ctx, error: Error) => {
          receivedError = error;
        },
      },
    ]);
    await actions.run("non-error-test");
    expect(receivedError).toBeInstanceOf(Error);
    expect(receivedError!.message).toBe("String error");
  });

  it("handles errors in onComplete gracefully", async () => {
    let executeCalled = false;
    const actions = define([
      {
        name: "oncomplete-error-test",
        description: "Test onComplete error",
        execute: async () => {
          executeCalled = true;
        },
        onComplete: async () => {
          throw new Error("onComplete error");
        },
      },
    ]);
    // Should not throw, error should be caught internally
    await actions.run("oncomplete-error-test");
    expect(executeCalled).toBe(true);
  });

  it("handles errors in onError gracefully", async () => {
    const actions = define([
      {
        name: "onerror-error-test",
        description: "Test onError error",
        execute: async () => {
          throw new Error("Original error");
        },
        onError: async () => {
          throw new Error("onError handler error");
        },
      },
    ]);
    // Should not throw, error should be caught internally
    await actions.run("onerror-error-test");
  });

  it("handles errors in onRun gracefully", async () => {
    let executeCalled = false;
    const actions = define([
      {
        name: "onrun-error-test",
        description: "Test onRun error",
        execute: async () => {
          executeCalled = true;
        },
        onRun: async () => {
          throw new Error("onRun error");
        },
      },
    ]);
    // Should not throw, error should be caught internally
    await actions.run("onrun-error-test");
    expect(executeCalled).toBe(true);
  });
});

