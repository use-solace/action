// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { define } from "../src/lib/runtime";

describe("action MVP", () => {
  it("defines an action and can run it", async () => {
    let ran = false;
    const defs = [
      {
        name: "test-action",
        description: "A test action",
        execute: async (_ctx: any) => {
          ran = true;
        },
      },
    ];
    const actions = define(defs as any);
    await actions.run("test-action");
    expect(ran).toBe(true);
  });
});
