import { ApiProperty } from '@nestjs/swagger';
import { EmployeeEntity } from '../../employees/entities/employee.entity';
import { RewardEntity } from './reward.entity';

export class RewardClaimResultEntity {
  @ApiProperty({ type: RewardEntity })
  reward: RewardEntity;

  @ApiProperty({ type: EmployeeEntity })
  employee: EmployeeEntity;
}
