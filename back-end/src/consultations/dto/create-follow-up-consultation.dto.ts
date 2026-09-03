import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFollowUpConsultationDto {
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

  @ApiPropertyOptional({
    example:
      'High nutrition follow-up recommended based on the latest employee update.',
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ example: 'checkin-1777718400000-a1b2c3d4' })
  @IsOptional()
  @IsString()
  sourceCheckinId?: string;

  @ApiPropertyOptional({ example: 'high' })
  @IsOptional()
  @IsString()
  followUpPriority?: string;
}

