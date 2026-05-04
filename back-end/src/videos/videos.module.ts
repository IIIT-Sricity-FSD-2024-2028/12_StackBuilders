import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { ExpertsModule } from '../experts/experts.module';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [CompaniesModule, ExpertsModule],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
