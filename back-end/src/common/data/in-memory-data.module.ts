import { Global, Module } from '@nestjs/common';
import { InMemoryDataService } from './in-memory-data.service';

@Global()
@Module({
  providers: [InMemoryDataService],
  exports: [InMemoryDataService],
})
export class InMemoryDataModule {}

