import { Injectable } from '@nestjs/common';
import { appendFile, mkdir, rename } from 'fs/promises';
import { join } from 'path';

// Dependency-free file logger for middleware-level events (request access lines,
// rate-limit rejections) — writes straight to disk the moment each line happens,
// no in-memory buffering, so nothing is lost if the process crashes. Log files are
// rotated daily: when the date changes, the current file is renamed to
// middleware-access-YYYY-MM-DD.log / middleware-error-YYYY-MM-DD.log and a fresh
// one is started — the "regular interval" at which log data is managed. Named
// middleware-* (rather than access.log/error.log) so it never collides with the
// Winston-managed application-*.log / error-*.log files.
@Injectable()
export class FileLoggerService {
  private static readonly LOG_DIR = join(process.cwd(), 'logs');
  private static readonly ACCESS_LOG_FILE = join(
    FileLoggerService.LOG_DIR,
    'middleware-access.log',
  );
  private static readonly ERROR_LOG_FILE = join(
    FileLoggerService.LOG_DIR,
    'middleware-error.log',
  );

  private dirReadyPromise: Promise<void> | null = null;
  private currentDate = FileLoggerService.today();

  logAccess(line: string): void {
    void this.writeLine(FileLoggerService.ACCESS_LOG_FILE, line);
  }

  logError(line: string): void {
    void this.writeLine(FileLoggerService.ERROR_LOG_FILE, line);
  }

  private static today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private ensureLogDir(): Promise<void> {
    if (!this.dirReadyPromise) {
      this.dirReadyPromise = mkdir(FileLoggerService.LOG_DIR, {
        recursive: true,
      }).then(() => undefined);
    }
    return this.dirReadyPromise;
  }

  /** Roll access/error logs to a date-stamped archive when the day changes. */
  private async rotateIfNeeded(): Promise<void> {
    const today = FileLoggerService.today();
    if (today === this.currentDate) return;

    const stamp = this.currentDate;
    this.currentDate = today;

    for (const file of [
      FileLoggerService.ACCESS_LOG_FILE,
      FileLoggerService.ERROR_LOG_FILE,
    ]) {
      try {
        await rename(file, file.replace(/\.log$/, `-${stamp}.log`));
      } catch {
        // Nothing to rotate on the very first write of a new day — ignore.
      }
    }
  }

  private async writeLine(file: string, line: string): Promise<void> {
    try {
      await this.ensureLogDir();
      await this.rotateIfNeeded();
      await appendFile(file, line + '\n', 'utf8');
    } catch (err) {
      // Never let a logging failure break a request — surface it on stderr instead.
      console.error(`[file-logger] failed to write log file ${file}:`, err);
    }
  }
}
