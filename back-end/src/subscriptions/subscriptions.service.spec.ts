import { ForbiddenException } from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService user entitlements', () => {
  let data: InMemoryDataService;
  let service: SubscriptionsService;
  const company = { id: 'CMP-1001', name: 'Acme Wellness' };

  beforeEach(() => {
    data = new InMemoryDataService();
    service = new SubscriptionsService(data);
  });

  it('rejects adding staff when the company has no active plan', () => {
    expect(() => service.assertCanAddUser(company, 'employee')).toThrow(
      ForbiddenException,
    );
    expect(() => service.assertCanAddUser(company, 'expert')).toThrow(
      ForbiddenException,
    );
  });

  it('does not treat an inactive subscription as an entitlement', () => {
    data.subscriptions.push({
      companyId: company.id,
      companyName: company.name,
      planId: 'starter',
      status: 'cancelled',
    });

    expect(() => service.assertCanAddUser(company, 'employee')).toThrow(
      ForbiddenException,
    );
  });

  it('allows additions under an active plan and enforces its category limits', () => {
    data.subscriptions.push({
      companyId: company.id,
      companyName: company.name,
      planId: 'starter',
      status: 'active',
    });

    expect(() => service.assertCanAddUser(company, 'employee')).not.toThrow();
    data.employees.push(
      ...Array.from({ length: 100 }, () => ({
        companyId: company.id,
        companyName: company.name,
      }) as any),
    );
    expect(() => service.assertCanAddUser(company, 'employee')).toThrow(
      ForbiddenException,
    );
  });

  it('rejects active subscriptions with unknown plan IDs', () => {
    data.subscriptions.push({
      companyName: company.name,
      planId: 'unlimited-free',
      status: 'active',
    });

    expect(() => service.assertCanAddUser(company, 'expert')).toThrow(
      ForbiddenException,
    );
  });
});
