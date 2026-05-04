import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Aarav Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ example: 'aarav.sharma@gmail.com' })
  @IsEmail()
  @Matches(/@gmail\.com$/i, {
    message: 'Enter a valid Gmail address for the employee.',
  })
  email: string;

  @ApiProperty({ example: 'secure123' })
  @IsString()
  @MinLength(6, {
    message: 'Employee password must be at least 6 characters long.',
  })
  password: string;

  @ApiProperty({ example: 'CMP-1001' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiPropertyOptional({ example: 'Stack Builders Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Active' })
  @IsOptional()
  @IsString()
  @IsIn(['Active', 'Inactive'])
  status?: string;

  @ApiPropertyOptional({ example: '28' })
  @IsOptional()
  @IsString()
  age?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '175' })
  @IsOptional()
  @IsString()
  heightCm?: string;

  @ApiPropertyOptional({ example: '72' })
  @IsOptional()
  @IsString()
  weightKg?: string;

  @ApiPropertyOptional({ example: '500' })
  @IsOptional()
  @IsString()
  rewardPointsBalance?: string;

  @ApiPropertyOptional({
    example: ['reward-1777718400000-a1b2c3d4'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  claimedRewardIds?: string[];
}
