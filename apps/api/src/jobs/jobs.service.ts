import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, type RedisOptions } from 'bullmq';
import type { Environment } from '../config/environment';

export function redisConnection(url: string): RedisOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : 0,
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
  };
}

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  readonly queue: Queue;
  private readonly worker: Worker;

  constructor(config: ConfigService<Environment, true>) {
    const connection = redisConnection(config.get('REDIS_URL', { infer: true }));
    const name = config.get('JOB_QUEUE_NAME', { infer: true });
    this.queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 20,
        removeOnFail: 50,
      },
    });
    this.worker = new Worker(
      name,
      async (job) => {
        if (job.name !== 'heartbeat') throw new Error('Unsupported system job');
        return { checkedAt: new Date().toISOString() };
      },
      { connection: { ...connection, maxRetriesPerRequest: null }, concurrency: 1 },
    );
    this.queue.on('error', () => this.logger.warn('Queue connection unavailable.'));
    this.worker.on('error', () => this.logger.warn('Worker connection unavailable.'));
    this.worker.on('failed', () => this.logger.error('System job failed; retry policy applies.'));
  }

  async onModuleInit() {
    await this.queue.waitUntilReady();
    await this.queue.upsertJobScheduler(
      'foundation-heartbeat',
      { every: 60_000 },
      {
        name: 'heartbeat',
        data: { version: 1 },
        opts: { removeOnComplete: 20, removeOnFail: 50 },
      },
    );
  }

  async check() {
    const redis = await this.queue.client;
    if (!(await redis.info()).includes('redis_version:') || !this.worker.isRunning())
      throw new Error('Queue unavailable');
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.queue.close();
  }
}
