export type IntervalUnit = "seconds" | "minutes" | "hours" | "days";
export interface ActionInterval {
  every: number;
  unit?: IntervalUnit;
}
export interface ActionDefinition {
  name: string;
  description: string;
  execute: (ctx: ActionContext) => Promise<void> | void;
  onRun?: (ctx: ActionContext) => Promise<void> | void;
  onComplete?: (ctx: ActionContext) => Promise<void> | void;
  onError?: (ctx: ActionContext, error: Error) => Promise<void> | void;
  interval?: ActionInterval;
}
export interface ActionContext {
  log: { info: (m: string) => void; error: (m: string) => void };
  bash?: any;
  now: () => Date;
  state?: any;
}
