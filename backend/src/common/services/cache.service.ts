import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private redisEnabled: boolean = false;

  constructor(private configService: ConfigService) {
    // Only enable Redis if explicitly configured
    const redisEnabled = this.configService.get('REDIS_ENABLED', 'false');
    
    if (redisEnabled === 'true') {
      this.redisEnabled = true;
      this.redis = new Redis({
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis max retries reached, disabling cache');
            this.redisEnabled = false;
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis connected successfully');
        this.redisEnabled = true;
      });

      this.redis.on('error', (error) => {
        this.logger.warn('Redis unavailable, caching disabled');
        this.redisEnabled = false;
      });
    } else {
      this.logger.log('Redis disabled - running without cache');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redisEnabled || !this.redis) return null;
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.debug(`Cache miss for key ${key}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.redisEnabled || !this.redis) return false;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.debug(`Cache set failed for key ${key}`);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redisEnabled || !this.redis) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redisEnabled || !this.redis) return false;
    
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.redisEnabled || !this.redis) return keys.map(() => null);
    
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      return keys.map(() => null);
    }
  }

  async setMany(keyValuePairs: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    if (!this.redisEnabled || !this.redis) return false;
    
    try {
      const pipeline = this.redis.pipeline();
      
      keyValuePairs.forEach(({ key, value, ttl }) => {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.redisEnabled || !this.redis) return false;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTTL(key: string): Promise<number> {
    if (!this.redisEnabled || !this.redis) return -1;
    
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      return -1;
    }
  }

  async extendTTL(key: string, additionalSeconds: number): Promise<boolean> {
    if (!this.redisEnabled || !this.redis) return false;
    
    try {
      const currentTTL = await this.getTTL(key);
      if (currentTTL > 0) {
        await this.redis.expire(key, currentTTL + additionalSeconds);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // Cache key generators
  static getPatientKey(tenantId: string, patientId: string): string {
    return `patient:${tenantId}:${patientId}`;
  }

  static getPatientsListKey(tenantId: string, clinicId?: string): string {
    return clinicId 
      ? `patients:${tenantId}:clinic:${clinicId}`
      : `patients:${tenantId}`;
  }

  static getDashboardKey(tenantId: string, filters: any): string {
    const filterHash = Buffer.from(JSON.stringify(filters)).toString('base64');
    return `dashboard:${tenantId}:${filterHash}`;
  }

  static getAnalyticsKey(tenantId: string, type: string, filters: any): string {
    const filterHash = Buffer.from(JSON.stringify(filters)).toString('base64');
    return `analytics:${tenantId}:${type}:${filterHash}`;
  }

  static getAppointmentKey(tenantId: string, appointmentId: string): string {
    return `appointment:${tenantId}:${appointmentId}`;
  }

  static getAppointmentsListKey(tenantId: string, providerId?: string, date?: string): string {
    if (providerId && date) {
      return `appointments:${tenantId}:provider:${providerId}:date:${date}`;
    }
    return providerId 
      ? `appointments:${tenantId}:provider:${providerId}`
      : `appointments:${tenantId}`;
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        this.logger.debug('Redis already disconnected');
      }
    }
  }
}
