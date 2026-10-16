import { ForbiddenException, Injectable } from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import { cleanText, normalizeLookupValue } from '../common/utils/record.utils';

const PLAN_LIMITS: Record<string, { employees: number; experts: number }> = {
  starter: { employees: 100, experts: 10 },
  business: { employees: 1000, experts: 50 },
  enterprise: { employees: 10000, experts: 100 },
};

type UserCategory = 'employee' | 'expert';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly data: InMemoryDataService) {}

  assertCanAddUser(company: { id: string; name: string }, category: UserCategory): void {
    const companyId = cleanText(company.id);
    const companyName = normalizeLookupValue(company.name);
    const subscription = this.data.subscriptions.find((entry) => {
      return (
        this.matchesCompany(entry, companyId, companyName) &&
        normalizeLookupValue(entry.status) === 'active'
      );
    });
    const planId = normalizeLookupValue(subscription?.planId);
    const limits = PLAN_LIMITS[planId];

    if (!subscription || !limits) {
      throw new ForbiddenException(
        'An active subscription plan is required before your company can add employees or wellness experts. Choose a plan from Upgrade Plan.',
      );
    }

    const records = category === 'employee' ? this.data.employees : this.data.experts;
    const currentCount = records.filter(
      (record) => this.matchesCompany(record, companyId, companyName),
    ).length;
    const limit = category === 'employee' ? limits.employees : limits.experts;

    if (currentCount >= limit) {
      const label = category === 'employee' ? 'Employee' : 'Wellness expert';
      throw new ForbiddenException(
        `${label} limit reached (${currentCount}/${limit}) on the ${subscription.planName || planId} plan. Upgrade the plan to add more.`,
      );
    }
  }

  // --- Subscriptions ---
  findAllSubscriptions() {
    return [...this.data.subscriptions];
  }

  bulkUpdateSubscriptions(subs: any[]) {
    if (Array.isArray(subs)) {
      this.data.subscriptions.length = 0;
      this.data.subscriptions.push(...subs);
    }
    return this.data.subscriptions;
  }

  // --- Payments ---
  findAllPayments() {
    return [...this.data.payments];
  }

  bulkUpdatePayments(payments: any[]) {
    if (Array.isArray(payments)) {
      this.data.payments.length = 0;
      this.data.payments.push(...payments);
    }
    return this.data.payments;
  }

  private matchesCompany(
    record: { companyId?: string; companyName?: string },
    companyId: string,
    companyName: string,
  ): boolean {
    const recordCompanyId = cleanText(record.companyId);
    if (companyId && recordCompanyId) return recordCompanyId === companyId;
    return Boolean(
      companyName &&
        normalizeLookupValue(record.companyName) === companyName,
    );
  }
}
