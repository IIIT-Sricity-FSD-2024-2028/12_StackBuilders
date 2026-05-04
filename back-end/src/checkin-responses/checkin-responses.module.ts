import { Module } from '@nestjs/common';
import { ExpertsModule } from '../experts/experts.module';
import { WellnessCheckinsModule } from '../wellness-checkins/wellness-checkins.module';
import { CheckinResponsesController } from './checkin-responses.controller';
import { CheckinResponsesService } from './checkin-responses.service';

@Module({
  imports: [ExpertsModule, WellnessCheckinsModule],
  controllers: [CheckinResponsesController],
  providers: [CheckinResponsesService],
  exports: [CheckinResponsesService],
})
export class CheckinResponsesModule {}

