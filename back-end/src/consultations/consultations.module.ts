import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { ExpertsModule } from '../experts/experts.module';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';

@Module({
  imports: [EmployeesModule, ExpertsModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}

