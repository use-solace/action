// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { define } from "../src/lib/runtime";

describe("Validation", () => {
  it("validates action definitions", () => {
    expect(() => {
      define([
        {
          name: 123, // Invalid: name must be a string
          description: "Invalid name",
          execute: async () => {},
        },
      ] as any);
    }).toThrow();
  });

  it("requires name field", () => {
    expect(() => {
      define([
        {
          description: "Missing name",
          execute: async () => {},
        } as any,
      ]);
    }).toThrow();
  });

  it("requires description field", () => {
    expect(() => {
      define([
        {
          name: "test",
          execute: async () => {},
        } as any,
      ]);
    }).toThrow();
  });

  it("requires execute function", () => {
    expect(() => {
      define([
        {
          name: "test",
          description: "Missing execute",
        } as any,
      ]);
    }).toThrow();
  });
});
