import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      this.logger.error(`Error getting multiple cache keys:`, error);
      return keys.map(() => null);
    }
  }

  async setMany(keyValuePairs: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
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
      this.logger.error(`Error setting multiple cache keys:`, error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error invalidating cache pattern ${pattern}:`, error);
      return false;
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  async extendTTL(key: string, additionalSeconds: number): Promise<boolean> {
    try {
      const currentTTL = await this.getTTL(key);
      if (currentTTL > 0) {
        await this.redis.expire(key, currentTTL + additionalSeconds);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error extending TTL for key ${key}:`, error);
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
    await this.redis.quit();
  }
}
