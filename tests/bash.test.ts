// @ts-expect-error Bun runtime is necessary for bun:test, some editors may flag line 2 as an error
import { describe, it, expect } from "bun:test";
import { bash } from "../src/lib/bash";

describe("Bash Utilities", () => {
  it("executes bash commands", async () => {
    const result = await bash.run("echo 'test'");
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("test");
  });

  it("captures command output", async () => {
    const result = await bash.run("echo 'hello world'");
    expect(result.stdout.trim()).toBe("hello world");
  });

  it("captures command errors", async () => {
    const result = await bash.run("echo 'error' >&2");
    expect(result.stderr.trim()).toBe("error");
  });

  it("handles command failures", async () => {
    const result = await bash.run("exit 1");
    expect(result.exitCode).toBe(1);
  });

  it("supports custom working directory", async () => {
    const result = await bash.run("pwd", { cwd: "/tmp" });
    expect(result.exitCode).toBe(0);
    // On macOS, /tmp resolves to /private/tmp, so check for either
    const pwd = result.stdout.trim();
    expect(pwd === "/tmp" || pwd === "/private/tmp").toBe(true);
  });

  it("supports custom environment variables", async () => {
    const result = await bash.run("echo $TEST_VAR", {
      env: { TEST_VAR: "test-value" },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("test-value");
  });

  it("merges custom env with process.env", async () => {
    const result = await bash.run("echo $PATH", {
      env: { TEST_VAR: "test" },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("/"); // PATH should still be set
  });
});

