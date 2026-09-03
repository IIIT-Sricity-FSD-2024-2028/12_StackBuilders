import { Injectable } from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly data: InMemoryDataService) {}

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
}
