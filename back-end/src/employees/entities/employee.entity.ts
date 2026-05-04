import { ApiProperty } from '@nestjs/swagger';

export class EmployeeEntity {
  @ApiProperty({ example: 'employee-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  name: string;

  @ApiProperty({ example: 'aarav.sharma@gmail.com' })
  email: string;

  @ApiProperty({ example: 'aarav.sharma@gmail.com' })
  username: string;

  @ApiProperty({ example: 'secure123' })
  password: string;

  @ApiProperty({ example: 'Engineering' })
  department: string;

  @ApiProperty({ example: 'Active' })
  status: string;

  @ApiProperty({ example: '28' })
  age: string;

  @ApiProperty({ example: 'Male' })
  gender: string;

  @ApiProperty({ example: '+91 98765 43210' })
  phoneNumber: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;

  @ApiProperty({ example: '175' })
  heightCm: string;

  @ApiProperty({ example: '72' })
  weightKg: string;

  @ApiProperty({ example: '500' })
  rewardPointsBalance: string;

  @ApiProperty({
    example: ['reward-1777718400000-a1b2c3d4'],
    type: [String],
  })
  claimedRewardIds: string[];

  @ApiProperty({ example: '2026-05-02T12:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-02T12:45:00.000Z' })
  updatedAt: string;
}
