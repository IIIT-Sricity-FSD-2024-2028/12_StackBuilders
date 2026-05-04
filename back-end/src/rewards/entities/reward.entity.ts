import { ApiProperty } from '@nestjs/swagger';

export class RewardEntity {
  @ApiProperty({ example: 'reward-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'https://example.com/reward.png' })
  imageUrl: string;

  @ApiProperty({ example: 'Amazon Voucher' })
  name: string;

  @ApiProperty({ example: 'Redeem this reward after completing the challenge.' })
  description: string;

  @ApiProperty({ example: '500' })
  points: string;

  @ApiProperty({ example: '10' })
  claimableCount: string;

  @ApiProperty({ example: '0' })
  claimedCount: string;

  @ApiProperty({ example: '2026-05-02T14:25:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: 'hr-1777718400000-a1b2c3d4' })
  creatorHrId: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;
}
