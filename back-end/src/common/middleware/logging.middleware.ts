import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { FileLoggerService } from './file-logger.service';

// Router-level logging middleware, applied globally (see AppModule#configure).
// Logs every request/response pair — including ones rejected by later guards —
// to the console and to a log file.
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly fileLogger: FileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      // Set by RoleHeaderGuard, which runs after middleware — by the time
      // 'finish' fires the whole request lifecycle (including guards) has
      // already completed, so it's populated whenever a role was required.
      const role = (req as unknown as { role?: string }).role || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      const line = [
        new Date().toISOString(),
        req.method,
        req.originalUrl,
        res.statusCode,
        `${durationMs}ms`,
        `role=${role}`,
        req.ip,
        `user-agent=${userAgent}`,
      ].join(' | ');

      if (res.statusCode >= 500) this.logger.error(line);
      else if (res.statusCode >= 400) this.logger.warn(line);
      else this.logger.log(line);

      this.fileLogger.logAccess(line);
    });

    next();
  }
}
