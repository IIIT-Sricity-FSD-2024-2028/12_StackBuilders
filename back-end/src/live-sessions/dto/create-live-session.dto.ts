import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLiveSessionDto {
  @ApiProperty({ example: 'Mindful Breathing Circle' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Mental Wellness' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Group Session' })
  @IsString()
  @IsNotEmpty()
  sessionType: string;

  @ApiProperty({ example: '2026-05-10' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '18:30' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '45 min' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({ example: '50' })
  @IsString()
  @IsNotEmpty()
  maxParticipants: string;

  @ApiProperty({ example: 'https://meet.example.com/live-session' })
  @IsString()
  @IsNotEmpty()
  meetingLink: string;

  @ApiProperty({ example: 'A live guided breathing and stress reset session.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'expert-1777718400000-a1b2c3d4' })
  @IsOptional()
  @IsString()
  expertId?: string;

  @ApiPropertyOptional({ example: 'Neha Verma' })
  @IsOptional()
  @IsString()
  hostName?: string;

  @ApiPropertyOptional({ example: 'CMP-1001' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ example: 'Stack Builders Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;
}

