import { PartialType } from '@nestjs/swagger';
import { CreateLiveSessionDto } from './create-live-session.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateLiveSessionDto extends PartialType(CreateLiveSessionDto) {
  @ApiPropertyOptional({ example: 'scheduled' })
  @IsOptional()
  @IsString()
  status?: string;
}

