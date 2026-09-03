import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BookConsultationSlotDto {
  @ApiProperty({ example: 'employee-1777718400000-a1b2c3d4' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiPropertyOptional({ example: 'Aarav Sharma' })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiProperty({ example: 'expert-1777718400000-a1b2c3d4' })
  @IsString()
  @IsNotEmpty()
  expertId: string;

  @ApiPropertyOptional({ example: 'Neha Verma' })
  @IsOptional()
  @IsString()
  expertName?: string;

  @ApiProperty({ example: 'Need guidance for nutrition planning.' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({ example: '2026-05-02T10:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  slotTime: string;
}
