// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { define } from "../src/lib/runtime";

describe("Multiple Actions", () => {
  it("can define and run multiple actions", async () => {
    let action1Ran = false;
    let action2Ran = false;
    const actions = define([
      {
        name: "multi-1",
        description: "Action 1",
        execute: async () => {
          action1Ran = true;
        },
      },
      {
        name: "multi-2",
        description: "Action 2",
        execute: async () => {
          action2Ran = true;
        },
      },
    ]);
    await actions.run("multi-1");
    await actions.run("multi-2");
    expect(action1Ran).toBe(true);
    expect(action2Ran).toBe(true);
  });

  it("throws error for duplicate action names", () => {
    expect(() => {
      define([
        {
          name: "duplicate",
          description: "First",
          execute: async () => {},
        },
        {
          name: "duplicate",
          description: "Second",
          execute: async () => {},
        },
      ]);
    }).toThrow("Duplicate action name: duplicate");
  });
});

