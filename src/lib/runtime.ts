import type { ActionDefinition, ActionContext, ActionInterval } from "./types";
import { ActionDefinitionSchema } from "./schema";
import { bash } from "./bash";

type InternalActionEntry = {
  def: ActionDefinition;
  nextAt: number;
  inFlight: boolean;
  hasRunOnRun: boolean;
};

const actionsMap = new Map<string, InternalActionEntry>();
let timer: any = null;

function unitToMs(unit: ActionInterval["unit"] | undefined): number {
  switch (unit) {
    case "seconds":
      return 1000;
    case "minutes":
      return 60 * 1000;
    case "hours":
      return 60 * 60 * 1000;
    case "days":
      return 24 * 60 * 60 * 1000;
    default:
      return 60 * 1000;
  }
}

function intervalMs(def: ActionDefinition): number {
  const every = def.interval?.every ?? 1;
  const unit = def.interval?.unit ?? "minutes";
  return every * unitToMs(unit);
}

function createContext(): ActionContext {
  const log = {
    info: (msg: string) => console.log("[action]", msg),
    error: (msg: string) => console.error("[action]", msg),
  };
  return { log, bash, now: () => new Date(), state: {} } as ActionContext;
}

async function runAction(name: string, entry: InternalActionEntry) {
  if (entry.inFlight) return;
  entry.inFlight = true;
  const ctx = createContext();
  try {
    await entry.def.execute(ctx);
    // onRun only executes once on the first execution
    if (entry.def.onRun && !entry.hasRunOnRun) {
      await entry.def.onRun(ctx);
      entry.hasRunOnRun = true;
    }
    // onComplete executes on every successful completion
    if (entry.def.onComplete) {
      try {
        await entry.def.onComplete(ctx);
      } catch (completeHandlerError) {
        ctx.log.error(
          `onComplete handler for action ${name} failed: ${String(completeHandlerError)}`
        );
      }
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    ctx.log.error(`action ${name} failed: ${error.message}`);
    // onError executes when action fails
    if (entry.def.onError) {
      try {
        await entry.def.onError(ctx, error);
      } catch (errorHandlerError) {
        ctx.log.error(
          `onError handler for action ${name} failed: ${String(errorHandlerError)}`
        );
      }
    }
  } finally {
    entry.inFlight = false;
    entry.nextAt = Date.now() + intervalMs(entry.def);
  }
}

function startScheduler() {
  if (timer) return;
  timer = setInterval(() => {
    const now = Date.now();
    for (const [name, entry] of actionsMap.entries()) {
      if (now >= entry.nextAt && !entry.inFlight) {
        runAction(name, entry);
      }
    }
  }, 1000);
}

export function define(defs: ActionDefinition[]) {
  for (const d of defs) {
    const res = ActionDefinitionSchema.safeParse(d);
    if (!res.success)
      throw new Error(`Invalid action definition: ${res.error.message}`);
  }
  for (const d of defs) {
    if (actionsMap.has(d.name))
      throw new Error(`Duplicate action name: ${d.name}`);
    const entry: InternalActionEntry = {
      def: d,
      nextAt: Date.now() + intervalMs(d),
      inFlight: false,
      hasRunOnRun: false,
    };
    actionsMap.set(d.name, entry);
  }
  startScheduler();
  return {
    run: async (name: string) => {
      const entry = actionsMap.get(name);
      if (!entry) throw new Error(`Unknown action: ${name}`);
      await runAction(name, entry);
    },
  };
}
