import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCheckinResponseDto {
  @ApiProperty({ example: 'checkin-1777718400000-a1b2c3d4' })
  @IsString()
  @IsNotEmpty()
  checkinId: string;

  @ApiProperty({ example: 'mental' })
  @IsString()
  @IsNotEmpty()
  checkinType: string;

  @ApiProperty({ example: 'employee-1777718400000-a1b2c3d4' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiPropertyOptional({ example: 'Aarav Sharma' })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiPropertyOptional({ example: 'expert-1777718400000-a1b2c3d4' })
  @IsOptional()
  @IsString()
  expertId?: string;

  @ApiPropertyOptional({ example: 'Neha Verma' })
  @IsOptional()
  @IsString()
  expertName?: string;

  @ApiPropertyOptional({ example: 'CMP-1001' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ example: 'Stack Builders Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: 'Please take a short break and let us follow up tomorrow.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

