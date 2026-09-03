import { Controller, Get, Post, Body, Param, Patch, Put, Req } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { QueryDto } from './dto/query.dto';

@Controller('queries')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  @Get()
  findAll() {
    return this.queriesService.findAll();
  }

  @Post()
  create(@Body() createQueryDto: QueryDto) {
    return this.queriesService.create(createQueryDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQueryDto: QueryDto) {
    return this.queriesService.update(id, updateQueryDto);
  }
  
  @Put('bulk')
  bulkUpdate(@Req() req: any) {
    return this.queriesService.bulkUpdate(req.body);
  }
}
