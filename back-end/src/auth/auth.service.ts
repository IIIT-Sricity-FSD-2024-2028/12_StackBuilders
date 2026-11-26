import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import * as nodemailer from 'nodemailer';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import { isValidEmailAddress } from '../common/utils/record.utils';

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_SENDS_PER_HOUR = 3;
const OTP_MAX_ATTEMPTS = 5;
const GENERIC_REQUEST_MESSAGE =
  'If an account matches that email, a verification code will arrive shortly.';

interface PasswordResetChallenge {
  digest: Buffer;
  expiresAt: number;
  attempts: number;
}

interface PasswordAccount {
  email: string;
  password: string;
  name?: string;
  updatedAt?: string;
}

interface DemoAccount extends PasswordAccount {
  name: string;
  role: string;
  path: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpSecret = randomBytes(32);
  private readonly challenges = new Map<string, PasswordResetChallenge>();
  private readonly requestHistory = new Map<string, number[]>();
  private readonly mailer: nodemailer.Transporter | null;
  private readonly mailFrom: string | null;
  private nextCleanupAt = 0;
  private readonly demoAccounts: DemoAccount[] = [
    {
      email: 'ravi@gmail.com',
      password: '1234',
      name: 'Super User',
      role: 'Admin',
      path: '/admin',
    },
    {
      email: 'raju@gmail.com',
      password: '1234',
      name: 'Supervisor',
      role: 'Supervisor',
      path: '/supervisor',
    },
  ];

  constructor(private readonly data: InMemoryDataService) {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER?.trim();
    const password = process.env.SMTP_PASSWORD;
    this.mailFrom = process.env.SMTP_FROM?.trim() || user || null;
    const hasPartialCredentials = Boolean(user) !== Boolean(password);

    this.mailer = host && this.mailFrom && !hasPartialCredentials
      ? nodemailer.createTransport({
          host,
          port,
          secure: process.env.SMTP_SECURE === 'true' || port === 465,
          ...(user && password ? { auth: { user, pass: password } } : {}),
        })
      : null;
  }

  async sendTransactionalEmail(
    message: nodemailer.SendMailOptions,
  ): Promise<void> {
    if (!this.mailer) {
      this.logger.warn('Email notification skipped because SMTP is not configured.');
      return;
    }

    try {
      await this.mailer.sendMail({
        ...message,
        from: message.from || this.mailFrom || undefined,
      });
    } catch (error) {
      this.logger.error(
        'Email notification could not be delivered.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async notifyPasswordChanged(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!isValidEmailAddress(normalizedEmail)) return;

    const changedAt = new Date().toISOString();
    await this.sendTransactionalEmail({
      to: normalizedEmail,
      subject: 'Your Stack Builders password was changed',
      text: [
        'The password for your Stack Builders account was successfully changed.',
        `Time: ${changedAt}`,
        '',
        'If you did not make this change, use Forgot password on the sign-in page to secure your account and contact your administrator.',
      ].join('\n'),
      html: `<p>The password for your Stack Builders account was successfully changed.</p><p>Time: ${changedAt}</p><p>If you did not make this change, use <strong>Forgot password</strong> on the sign-in page to secure your account and contact your administrator.</p>`,
    });
  }

  authenticateDemoAccount(email: string, password: string) {
    const account = this.demoAccounts.find(
      (entry) => entry.email === this.normalizeEmail(email),
    );

    if (!account || account.password !== String(password || '').trim()) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return {
      profile: {
        id: account.email,
        name: account.name,
        email: account.email,
        role: account.role,
      },
      role: account.role,
      path: account.path,
    };
  }

  changeDemoPassword(email: string, currentPassword: string, newPassword: string) {
    const account = this.demoAccounts.find(
      (entry) => entry.email === this.normalizeEmail(email),
    );
    if (!account || account.password !== String(currentPassword || '').trim()) {
      throw new UnauthorizedException('The current password is incorrect.');
    }

    const password = String(newPassword || '').trim();
    if (password.length < 6 || password.length > 128) {
      throw new BadRequestException(
        'Your new password must be between 6 and 128 characters.',
      );
    }

    account.password = password;
    account.updatedAt = new Date().toISOString();
    void this.notifyPasswordChanged(account.email);
    return {
      message:
        'Password updated. It will return to the demo default after the server restarts.',
    };
  }

  requestPasswordReset(email: string) {
    if (!this.mailer) {
      throw new ServiceUnavailableException(
        'Password recovery email is not configured on the server.',
      );
    }

    const normalizedEmail = this.normalizeEmail(email);
    const now = Date.now();
    this.cleanupExpiredState(now);
    const previousRequests = (this.requestHistory.get(normalizedEmail) || []).filter(
      (timestamp) => now - timestamp < 60 * 60 * 1000,
    );
    const lastRequestAt = previousRequests[previousRequests.length - 1] || 0;
    if (
      now - lastRequestAt < OTP_RESEND_COOLDOWN_MS ||
      previousRequests.length >= OTP_MAX_SENDS_PER_HOUR
    ) {
      return { message: GENERIC_REQUEST_MESSAGE };
    }

    previousRequests.push(now);
    this.requestHistory.set(normalizedEmail, previousRequests);

    const accounts = this.findAccounts(normalizedEmail);
    if (!accounts.length) {
      return { message: GENERIC_REQUEST_MESSAGE };
    }

    const code = String(randomInt(100000, 1000000));
    const challenge: PasswordResetChallenge = {
      digest: this.digestCode(normalizedEmail, code),
      expiresAt: now + OTP_LIFETIME_MS,
      attempts: 0,
    };
    this.challenges.set(normalizedEmail, challenge);

    void this.deliverRecoveryCode(normalizedEmail, code, challenge, now);

    return { message: GENERIC_REQUEST_MESSAGE };
  }

  private async deliverRecoveryCode(
    email: string,
    code: string,
    challenge: PasswordResetChallenge,
    requestTimestamp: number,
  ): Promise<void> {
    try {
      await this.mailer!.sendMail({
        from: this.mailFrom || undefined,
        to: email,
        subject: 'Your Stack Builders password reset code',
        text: `Your password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
        html: `<p>Your password reset code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
      });
    } catch (error) {
      if (this.challenges.get(email) === challenge) {
        this.challenges.delete(email);
      }
      const previousRequests = this.requestHistory.get(email) || [];
      this.requestHistory.set(email, previousRequests.filter((timestamp) => timestamp !== requestTimestamp));
      this.logger.error(
        'Password recovery email could not be delivered.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  resetPassword(email: string, code: string, newPassword: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const challenge = this.challenges.get(normalizedEmail);
    if (!challenge || challenge.expiresAt <= Date.now()) {
      this.challenges.delete(normalizedEmail);
      throw new BadRequestException('The code is invalid or has expired.');
    }

    const submittedDigest = this.digestCode(normalizedEmail, code);
    const matches = timingSafeEqual(challenge.digest, submittedDigest);
    if (!matches) {
      challenge.attempts += 1;
      if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
        this.challenges.delete(normalizedEmail);
      }
      throw new BadRequestException('The code is invalid or has expired.');
    }

    const password = String(newPassword || '').trim();
    if (password.length < 6 || password.length > 128) {
      throw new BadRequestException(
        'Your new password must be between 6 and 128 characters.',
      );
    }

    const accounts = this.findAccounts(normalizedEmail);
    if (!accounts.length) {
      this.challenges.delete(normalizedEmail);
      throw new BadRequestException('The code is invalid or has expired.');
    }

    for (const account of accounts) {
      account.password = password;
      account.updatedAt = new Date().toISOString();
    }
    this.challenges.delete(normalizedEmail);
    void this.notifyPasswordChanged(normalizedEmail);

    return { message: 'Your password has been updated.' };
  }

  private findAccounts(email: string): PasswordAccount[] {
    return [
      ...this.data.employees.filter(
        (account) => this.normalizeEmail(account.email) === email,
      ),
      ...this.data.experts.filter(
        (account) => this.normalizeEmail(account.email) === email,
      ),
      ...this.data.hrProfiles.filter(
        (account) => this.normalizeEmail(account.email) === email,
      ),
      ...this.demoAccounts.filter(
        (account) => this.normalizeEmail(account.email) === email,
      ),
    ];
  }

  private digestCode(email: string, code: string): Buffer {
    return createHmac('sha256', this.otpSecret)
      .update(`${email}:${code}`)
      .digest();
  }

  private cleanupExpiredState(now: number): void {
    if (now < this.nextCleanupAt) return;
    this.nextCleanupAt = now + 5 * 60 * 1000;

    for (const [email, challenge] of this.challenges) {
      if (challenge.expiresAt <= now) this.challenges.delete(email);
    }
    for (const [email, timestamps] of this.requestHistory) {
      const recent = timestamps.filter((timestamp) => now - timestamp < 60 * 60 * 1000);
      if (recent.length) this.requestHistory.set(email, recent);
      else this.requestHistory.delete(email);
    }
  }

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }
}
