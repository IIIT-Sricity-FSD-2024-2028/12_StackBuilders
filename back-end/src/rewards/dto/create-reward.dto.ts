import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ example: 'https://example.com/reward.png' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ example: 'Amazon Voucher' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Redeem this reward after completing the challenge.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '500' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d*$/, {
    message: 'Points needed must be a positive whole number.',
  })
  points: string;

  @ApiProperty({ example: '10' })
  @IsString()
  @IsNotEmpty()
  claimableCount: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  claimedCount?: string;

  @ApiPropertyOptional({ example: 'hr-1777718400000-a1b2c3d4' })
  @IsOptional()
  @IsString()
  creatorHrId?: string;

  @ApiPropertyOptional({ example: 'CMP-1001' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ example: 'Stack Builders Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;
}
