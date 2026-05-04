import { ApiProperty } from '@nestjs/swagger';
import { ConsultationEntity } from './consultation.entity';

export class ConsultationLookupResultEntity {
  @ApiProperty({
    required: false,
    nullable: true,
    type: ConsultationEntity,
  })
  consultation: ConsultationEntity | null;
}

