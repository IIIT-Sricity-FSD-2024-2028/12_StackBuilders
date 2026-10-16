import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [CompaniesModule, SubscriptionsModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}

