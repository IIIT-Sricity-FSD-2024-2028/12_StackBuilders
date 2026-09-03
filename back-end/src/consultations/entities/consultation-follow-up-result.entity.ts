import { ApiProperty } from '@nestjs/swagger';
import { ConsultationEntity } from './consultation.entity';

export class ConsultationFollowUpResultEntity {
  @ApiProperty({ type: ConsultationEntity })
  consultation: ConsultationEntity;

  @ApiProperty({ example: false })
  reused: boolean;
}

