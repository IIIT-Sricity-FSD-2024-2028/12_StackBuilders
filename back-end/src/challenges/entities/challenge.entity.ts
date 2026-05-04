import { ApiProperty } from '@nestjs/swagger';

export class ChallengeEntity {
  @ApiProperty({ example: 'challenge-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: '10k Step Sprint' })
  name: string;

  @ApiProperty({ example: 'Fitness' })
  type: string;

  @ApiProperty({ example: '500' })
  reward: string;

  @ApiProperty({ example: '2099-12-31' })
  deadline: string;

  @ApiProperty({ example: 'Complete 10,000 steps for 7 days.' })
  goal: string;

  @ApiProperty({ example: '2026-05-02T14:25:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: 'hr-1777718400000-a1b2c3d4' })
  creatorHrId: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;
}
