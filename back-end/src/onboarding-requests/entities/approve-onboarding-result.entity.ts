import { ApiProperty } from '@nestjs/swagger';
import { CompanyEntity } from '../../companies/entities/company.entity';
import { HrProfileEntity } from '../../hr-profiles/entities/hr-profile.entity';

export class ApproveOnboardingResultEntity {
  @ApiProperty({ type: CompanyEntity })
  company: CompanyEntity;

  @ApiProperty({ type: HrProfileEntity })
  hrProfile: HrProfileEntity;

  @ApiProperty({ example: 'request-1777718400000-a1b2c3d4' })
  removedRequestId: string;
}

