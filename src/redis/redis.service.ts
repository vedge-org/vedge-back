import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { promisify } from 'util';
import { Store } from 'express-session';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    @Inject('SESSION_STORE')
    private readonly sessionStore: Store,
  ) {
    // Promisify session store methods
    this.getSession = promisify(this.sessionStore.get).bind(this.sessionStore);
    this.setSession = promisify(this.sessionStore.set).bind(this.sessionStore);
    this.destroySession = promisify(this.sessionStore.destroy).bind(this.sessionStore);
    this.touchSession = promisify(this.sessionStore.touch).bind(this.sessionStore);
  }

  private getSession: (sid: string) => Promise<any>;
  private setSession: (sid: string, session: any) => Promise<void>;
  private destroySession: (sid: string) => Promise<void>;
  private touchSession: (sid: string, session: any) => Promise<void>;

  async set(key: string, value: string, ttl?: number): Promise<void> {
    ttl ? await this.redis.setex(key, ttl, value) : await this.redis.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getSessionData(sessionId: string): Promise<any> {
    return await this.getSession(sessionId);
  }

  async setSessionData(sessionId: string, data: any): Promise<void> {
    await this.setSession(sessionId, data);
  }

  async removeSession(sessionId: string): Promise<void> {
    await this.destroySession(sessionId);
  }

  async updateSessionTTL(sessionId: string): Promise<void> {
    await this.touchSession(sessionId, {});
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return (await this.redis.expire(key, seconds)) === 1;
  }

  async scan(pattern: string): Promise<string[]> {
    let cursor = '0';
    const keys: string[] = [];

    do {
      const [newCursor, foundKeys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = newCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    return keys;
  }
}
