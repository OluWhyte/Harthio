/**
 * Redis-Backed Rate Limiting
 * 
 * Implements persistent rate limiting using Redis to ensure limits
 * persist across server restarts and work in distributed environments.
 * 
 * Features:
 * - Sliding window algorithm for accurate rate limiting
 * - Persistent storage (survives server restarts)
 * - Distributed support (works across multiple servers)
 * - Automatic cleanup of expired entries
 * 
 * Usage:
 *   import { redisRateLimit } from '@/lib/redis-rate-limit';
 *   
 *   const limited = await redisRateLimit(request, {
 *     windowMs: 60000,
 *     maxRequests: 10,
 *     identifier: userId
 *   });
 *   
 *   if (limited) return limited; // Returns 429 response
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

// Redis client configuration
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client
 */
async function getRedisClient() {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }

    // Check if Redis URL is configured
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

    if (!redisUrl) {
        console.warn('⚠️ Redis not configured - falling back to in-memory rate limiting');
        return null;
    }

    try {
        redisClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('❌ Redis connection failed after 10 retries');
                        return new Error('Redis connection failed');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            console.error('❌ Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('❌ Failed to connect to Redis:', error);
        return null;
    }
}

interface RateLimitOptions {
    windowMs: number;        // Time window in milliseconds
    maxRequests: number;     // Maximum requests allowed in window
    identifier?: string;     // Custom identifier (userId, IP, etc.)
    keyPrefix?: string;      // Prefix for Redis keys
}

/**
 * Redis-backed rate limiting with sliding window algorithm
 */
export async function redisRateLimit(
    request: NextRequest,
    options: RateLimitOptions
): Promise<NextResponse | null> {
    const {
        windowMs,
        maxRequests,
        identifier,
        keyPrefix = 'ratelimit'
    } = options;

    // Get identifier (custom, IP, or unknown)
    const id = identifier ||
        request.ip ||
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    const redis = await getRedisClient();

    // Fallback to in-memory rate limiting if Redis unavailable
    if (!redis) {
        return inMemoryRateLimit(request, options);
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const key = `${keyPrefix}:${id}`;

    try {
        // Use Redis sorted set for sliding window
        // Score is timestamp, member is unique request ID
        const requestId = `${now}:${Math.random()}`;

        // Start transaction
        const multi = redis.multi();

        // Remove old entries outside the window
        multi.zRemRangeByScore(key, 0, windowStart);

        // Add current request
        multi.zAdd(key, { score: now, value: requestId });

        // Count requests in window
        multi.zCard(key);

        // Set expiry on the key
        multi.expire(key, Math.ceil(windowMs / 1000));

        // Execute transaction
        const results = await multi.exec();
        const count = results[2] as unknown as number;

        if (count > maxRequests) {
            // Get oldest request to calculate reset time
            const oldest = await redis.zRange(key, 0, 0, { REV: false });
            const oldestScore = oldest.length > 0
                ? parseFloat(oldest[0].split(':')[0])
                : now;
            const resetTime = oldestScore + windowMs;
            const retryAfter = Math.ceil((resetTime - now) / 1000);

            return NextResponse.json(
                {
                    error: 'Too many requests. Please try again later.',
                    retryAfter,
                    limit: maxRequests,
                    remaining: 0,
                    reset: new Date(resetTime).toISOString()
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': retryAfter.toString(),
                        'X-RateLimit-Limit': maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(resetTime).toISOString()
                    }
                }
            );
        }

        // Request allowed
        return null;
    } catch (error) {
        console.error('❌ Redis rate limit error:', error);
        // Fallback to in-memory on Redis error
        return inMemoryRateLimit(request, options);
    }
}

/**
 * Fallback in-memory rate limiting
 */
const memoryStore = new Map<string, { requests: number[]; }>();

function inMemoryRateLimit(
    request: NextRequest,
    options: RateLimitOptions
): NextResponse | null {
    const { windowMs, maxRequests, identifier } = options;

    const id = identifier ||
        request.ip ||
        request.headers.get('x-forwarded-for') ||
        'unknown';

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create record
    let record = memoryStore.get(id);
    if (!record) {
        record = { requests: [] };
        memoryStore.set(id, record);
    }

    // Remove old requests outside window
    record.requests = record.requests.filter(time => time > windowStart);

    // Check if limit exceeded
    if (record.requests.length >= maxRequests) {
        const oldestRequest = Math.min(...record.requests);
        const resetTime = oldestRequest + windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return NextResponse.json(
            {
                error: 'Too many requests. Please try again later.',
                retryAfter,
                limit: maxRequests,
                remaining: 0,
                reset: new Date(resetTime).toISOString()
            },
            {
                status: 429,
                headers: {
                    'Retry-After': retryAfter.toString(),
                    'X-RateLimit-Limit': maxRequests.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': new Date(resetTime).toISOString()
                }
            }
        );
    }

    // Add current request
    record.requests.push(now);

    return null;
}

/**
 * Predefined rate limiters with Redis support
 */
export const strictRedisRateLimit = (request: NextRequest, identifier?: string) =>
    redisRateLimit(request, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        identifier,
        keyPrefix: 'strict'
    });

export const moderateRedisRateLimit = (request: NextRequest, identifier?: string) =>
    redisRateLimit(request, {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        identifier,
        keyPrefix: 'moderate'
    });

export const lenientRedisRateLimit = (request: NextRequest, identifier?: string) =>
    redisRateLimit(request, {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        identifier,
        keyPrefix: 'lenient'
    });

export const authRedisRateLimit = (request: NextRequest, identifier?: string) =>
    redisRateLimit(request, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        identifier,
        keyPrefix: 'auth'
    });

export const emailRedisRateLimit = (request: NextRequest, identifier?: string) =>
    redisRateLimit(request, {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        identifier,
        keyPrefix: 'email'
    });

/**
 * Cleanup function to close Redis connection
 */
export async function closeRedisConnection() {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        redisClient = null;
    }
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
    process.on('SIGTERM', closeRedisConnection);
    process.on('SIGINT', closeRedisConnection);
}
