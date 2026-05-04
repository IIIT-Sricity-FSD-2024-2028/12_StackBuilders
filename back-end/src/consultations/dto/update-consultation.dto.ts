import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateConsultationDto {
  @ApiPropertyOptional({ example: 'requested' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Consultation request could not be scheduled.' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ example: 'Nutrition Consultation with Aarav Sharma' })
  @IsOptional()
  @IsString()
  sessionTitle?: string;

  @ApiPropertyOptional({ example: '2026-05-03' })
  @IsOptional()
  @IsString()
  sessionDate?: string;

  @ApiPropertyOptional({ example: '18:30' })
  @IsOptional()
  @IsString()
  sessionTime?: string;

  @ApiPropertyOptional({ example: '45 min' })
  @IsOptional()
  @IsString()
  sessionDuration?: string;

  @ApiPropertyOptional({ example: 'https://meet.example.com/session' })
  @IsOptional()
  @IsString()
  sessionMeetingLink?: string;

  @ApiPropertyOptional({ example: '2026-05-02T13:00:00.000Z' })
  @IsOptional()
  @IsString()
  sessionCreatedAt?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  createdByExpert?: boolean;

  @ApiPropertyOptional({ example: 'checkin-1777718400000-a1b2c3d4' })
  @IsOptional()
  @IsString()
  sourceCheckinId?: string;

  @ApiPropertyOptional({ example: 'high' })
  @IsOptional()
  @IsString()
  followUpPriority?: string;

  @ApiPropertyOptional({ example: 'Need guidance for nutrition planning.' })
  @IsOptional()
  @IsString()
  purpose?: string;
}

