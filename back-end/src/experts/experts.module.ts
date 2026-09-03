import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { ExpertsController } from './experts.controller';
import { ExpertsService } from './experts.service';

@Module({
  imports: [CompaniesModule],
  controllers: [ExpertsController],
  providers: [ExpertsService],
  exports: [ExpertsService],
})
export class ExpertsModule {}

