import { spawn } from "child_process";

export const bash = {
  run: async (
    cmd: string,
    opts?: { cwd?: string; env?: Record<string, string> }
  ) => {
    return new Promise<{ exitCode: number; stdout: string; stderr: string }>(
      (resolve) => {
        const child = spawn(cmd, {
          shell: true,
          cwd: opts?.cwd,
          env: { ...process.env, ...(opts?.env ?? {}) },
          stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        if (child.stdout)
          child.stdout.on("data", (d) => (stdout += d.toString()));
        if (child.stderr)
          child.stderr.on("data", (d) => (stderr += d.toString()));
        child.on("close", (code) => {
          resolve({ exitCode: code ?? 0, stdout, stderr });
        });
      }
    );
  },
};
