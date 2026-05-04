import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { WellnessCheckinsController } from './wellness-checkins.controller';
import { WellnessCheckinsService } from './wellness-checkins.service';

@Module({
  imports: [EmployeesModule],
  controllers: [WellnessCheckinsController],
  providers: [WellnessCheckinsService],
  exports: [WellnessCheckinsService],
})
export class WellnessCheckinsModule {}

