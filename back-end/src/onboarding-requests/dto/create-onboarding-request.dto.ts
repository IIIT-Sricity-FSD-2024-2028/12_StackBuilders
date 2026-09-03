import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateOnboardingRequestDto {
  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  companyPhone: string;

  @ApiProperty({ example: 'Bengaluru, Karnataka' })
  @IsString()
  @IsNotEmpty()
  companyAddress: string;

  @ApiProperty({ example: 'contact@stackbuilders.com' })
  @IsEmail()
  companyEmail: string;

  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  hrName: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  hrPhoneNumber?: string;

  @ApiProperty({ example: 'priya.sharma@gmail.com' })
  @IsEmail()
  @Matches(/@gmail\.com$/i, {
    message: 'Use a valid Gmail address for the HR login email.',
  })
  hrEmail: string;

  @ApiProperty({ example: 'secure123' })
  @IsString()
  @MinLength(6, {
    message: 'HR password must be at least 6 characters long.',
  })
  hrPassword: string;
}
