import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { FileLoggerService } from './file-logger.service';

// Security middleware (part 1) — hardens every response with the standard
// protective headers, set directly rather than through a third-party
// dependency.
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
    );
    res.setHeader('Cache-Control', 'no-store');
    res.removeHeader('X-Powered-By');

    next();
  }
}

// Security middleware (part 2) — a simple in-memory fixed-window rate limiter
// that throttles how fast any one caller can hit the API, guarding against
// accidental spam (double-submits, runaway scripts) or deliberate abuse.
// Deliberately in-memory/per-process — this app has no shared cache layer, and
// per-process limiting is enough for this scope.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 300;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, Bucket>();
  private readonly sweepTimer: NodeJS.Timeout;

  constructor(private readonly fileLogger: FileLoggerService) {
    // Prevent unbounded growth of the bucket map from one-off/anonymous callers.
    this.sweepTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(key);
      }
    }, SWEEP_INTERVAL_MS);
    this.sweepTimer.unref();
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const key = this.resolveKey(req);
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;

    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    res.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(0, MAX_REQUESTS_PER_WINDOW - bucket.count)),
    );

    if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));

      this.fileLogger.logError(
        [
          new Date().toISOString(),
          'ERROR',
          req.method,
          req.originalUrl,
          HttpStatus.TOO_MANY_REQUESTS,
          `key=${key.slice(0, 24)}...`,
          `Rate limit exceeded (${bucket.count}/${MAX_REQUESTS_PER_WINDOW} per ${WINDOW_MS / 1000}s)`,
        ].join(' | '),
      );

      throw new HttpException(
        'Too many requests — please slow down and try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  // Key on the caller's own identity when there is one (a bearer token would be
  // stable per-user); this app has no auth token scheme today, so this falls
  // straight through to IP, which is what actually keys every request here.
  private resolveKey(req: Request): string {
    return req.headers.authorization || req.ip || 'anonymous';
  }
}
