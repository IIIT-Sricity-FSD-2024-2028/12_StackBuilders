import { ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AuthService } from './auth.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('AuthService mail configuration', () => {
  const originalEnvironment = { ...process.env };
  const transport = {
    verify: jest.fn(),
    sendMail: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    for (const name of [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_SECURE',
      'SMTP_USER',
      'SMTP_PASSWORD',
      'SMTP_FROM',
    ]) {
      delete process.env[name];
    }
    (nodemailer.createTransport as jest.Mock).mockReturnValue(transport);
    transport.verify.mockResolvedValue(true);
    transport.sendMail.mockResolvedValue({ messageId: 'test-message' });
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  function createService(): AuthService {
    return new AuthService({
      employees: [],
      experts: [],
      hrProfiles: [],
    } as never);
  }

  it('reports password recovery as unavailable when SMTP is not configured', () => {
    const service = createService();

    expect(() => service.requestPasswordReset('ravi@gmail.com')).toThrow(
      ServiceUnavailableException,
    );
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('verifies configured SMTP and sends a recovery message', async () => {
    process.env.SMTP_HOST = 'smtp.test.local';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'mailer@test.local';
    process.env.SMTP_PASSWORD = 'test-password';
    process.env.SMTP_FROM = 'Stack Builders <no-reply@test.local>';

    const service = createService();
    await service.onModuleInit();
    service.requestPasswordReset('ravi@gmail.com');

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.test.local',
        port: 587,
        secure: false,
        auth: { user: 'mailer@test.local', pass: 'test-password' },
      }),
    );
    expect(transport.verify).toHaveBeenCalledTimes(1);
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ravi@gmail.com',
        subject: 'Your Stack Builders password reset code',
      }),
    );
  });

  it('rejects partial SMTP credentials instead of building a broken transport', () => {
    process.env.SMTP_HOST = 'smtp.test.local';
    process.env.SMTP_FROM = 'no-reply@test.local';
    process.env.SMTP_USER = 'mailer@test.local';

    const service = createService();

    expect(() => service.requestPasswordReset('ravi@gmail.com')).toThrow(
      ServiceUnavailableException,
    );
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
});
