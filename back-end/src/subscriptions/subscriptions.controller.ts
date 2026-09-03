import { Controller, Get, Put, Req } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  findAllSubscriptions() {
    return this.subscriptionsService.findAllSubscriptions();
  }

  @Put('bulk')
  bulkUpdateSubscriptions(@Req() req: any) {
    return this.subscriptionsService.bulkUpdateSubscriptions(req.body);
  }

  @Get('payments')
  findAllPayments() {
    return this.subscriptionsService.findAllPayments();
  }

  @Put('payments/bulk')
  bulkUpdatePayments(@Req() req: any) {
    return this.subscriptionsService.bulkUpdatePayments(req.body);
  }
}
