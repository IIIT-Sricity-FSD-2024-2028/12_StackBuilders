import { Module } from '@nestjs/common';
import { ExpertsModule } from '../experts/experts.module';
import { LiveSessionsController } from './live-sessions.controller';
import { LiveSessionsService } from './live-sessions.service';

@Module({
  imports: [ExpertsModule],
  controllers: [LiveSessionsController],
  providers: [LiveSessionsService],
  exports: [LiveSessionsService],
})
export class LiveSessionsModule {}

