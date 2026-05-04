import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateChallengeDto {
  @ApiProperty({ example: '10k Step Sprint' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Fitness' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: '500' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d*$/, {
    message: 'Challenge reward must be a positive whole number.',
  })
  reward: string;

  @ApiPropertyOptional({ example: '2099-12-31' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiProperty({ example: 'Complete 10,000 steps for 7 days.' })
  @IsString()
  @IsNotEmpty()
  goal: string;

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
