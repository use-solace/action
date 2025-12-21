import { z } from 'zod';
export const ActionDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  execute: z.function().args(z.any()).returns(z.any()),
  onRun: z.function().args(z.any()).returns(z.any()).optional(),
  interval: z.object({ every: z.number().int().positive(), unit: z.enum(['seconds','minutes','hours','days']).optional() }).optional()
});
export type ActionDefinitionSchemaType = z.infer<typeof ActionDefinitionSchema>;
