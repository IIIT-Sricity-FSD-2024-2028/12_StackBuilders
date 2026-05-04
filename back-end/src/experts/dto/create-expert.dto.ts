import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateExpertDto {
  @ApiProperty({ example: 'Neha Verma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Nutritionist' })
  @IsString()
  @IsNotEmpty()
  specialization: string;

  @ApiProperty({ example: '5' })
  @IsString()
  @IsNotEmpty()
  experience: string;

  @ApiProperty({ example: 'neha.verma@gmail.com' })
  @IsEmail()
  @Matches(/@gmail\.com$/i, {
    message: 'Enter a valid Gmail address for the wellness expert.',
  })
  email: string;

  @ApiProperty({ example: 'secure123' })
  @IsString()
  @MinLength(6, {
    message: 'Wellness expert password must be at least 6 characters long.',
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

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Active' })
  @IsOptional()
  @IsString()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}

