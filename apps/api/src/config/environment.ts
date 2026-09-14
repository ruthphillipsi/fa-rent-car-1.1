import { z } from 'zod';

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.url().refine((value) => value.startsWith('postgresql://')),
  REDIS_URL: z.url().refine((value) => /^rediss?:\/\//.test(value)),
  JWT_SECRET: z.string().min(48),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(16),
  JOB_QUEUE_NAME: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .default('fa-system'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(input: Record<string, unknown>): Environment {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment configuration: ${names}`);
  }
  return result.data;
}
