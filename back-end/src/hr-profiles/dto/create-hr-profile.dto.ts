import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateHrProfileDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'priya.sharma@gmail.com' })
  @IsEmail()
  @Matches(/@gmail\.com$/i, {
    message: 'Use a valid Gmail address for the HR login email.',
  })
  email: string;

  @ApiProperty({ example: 'secure123' })
  @IsString()
  @MinLength(6, {
    message: 'HR password must be at least 6 characters long.',
  })
  password: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'HR' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'HR Admin' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'CMP-1001' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ example: 'Stack Builders Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Active' })
  @IsOptional()
  @IsString()
  @IsIn(['Active', 'Inactive'])
  status?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  createdBySuperUser?: boolean;
}
