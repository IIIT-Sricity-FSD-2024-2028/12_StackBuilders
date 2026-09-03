import { Injectable } from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';

@Injectable()
export class QueriesService {
  constructor(private readonly data: InMemoryDataService) {}

  findAll() {
    return [...this.data.queries];
  }

  create(queryDto: any) {
    const query = {
      ...queryDto,
      id: "Q-" + Date.now(),
      createdAt: Date.now()
    };
    this.data.queries.push(query);
    return query;
  }

  update(id: string, updateDto: any) {
    const queryIndex = this.data.queries.findIndex(q => q.id === id);
    if (queryIndex > -1) {
      this.data.queries[queryIndex] = { ...this.data.queries[queryIndex], ...updateDto };
      return this.data.queries[queryIndex];
    }
    return null;
  }
  
  bulkUpdate(queriesDto: any[]) {
      if (Array.isArray(queriesDto)) {
          this.data.queries.length = 0;
          this.data.queries.push(...queriesDto);
      }
      return this.data.queries;
  }
}
