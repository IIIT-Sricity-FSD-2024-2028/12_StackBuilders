import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ClaimRewardDto {
  @ApiProperty({ example: 'employee-1777718400000-a1b2c3d4' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;
}
