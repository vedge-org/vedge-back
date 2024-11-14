import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Store } from 'express-session';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    @Inject('SESSION_STORE')
    private readonly sessionStore: Store,
  ) {}

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getSessionData(sessionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sessionStore.get(sessionId, (err, session) => {
        if (err) reject(err);
        resolve(session);
      });
    });
  }

  async setSessionData(sessionId: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionStore.set(sessionId, data, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async destroySession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionStore.destroy(sessionId, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async touchSession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionStore.touch(sessionId, {}, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async exists(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.redis.expire(key, seconds);
    return result === 1;
  }
}
