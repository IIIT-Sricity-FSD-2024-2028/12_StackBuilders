import { ApiProperty } from '@nestjs/swagger';

export class LiveSessionEntity {
  @ApiProperty({ example: 'live-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'Mindful Breathing Circle' })
  title: string;

  @ApiProperty({ example: 'Mental Wellness' })
  category: string;

  @ApiProperty({ example: 'Group Session' })
  sessionType: string;

  @ApiProperty({ example: '2026-05-10' })
  date: string;

  @ApiProperty({ example: '18:30' })
  startTime: string;

  @ApiProperty({ example: '45 min' })
  duration: string;

  @ApiProperty({ example: '50' })
  maxParticipants: string;

  @ApiProperty({ example: 'https://meet.example.com/live-session' })
  meetingLink: string;

  @ApiProperty({ example: 'A live guided breathing and stress reset session.' })
  description: string;

  @ApiProperty({ example: '2026-05-02T12:45:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: 'scheduled' })
  status: string;

  @ApiProperty({ example: 'expert-1777718400000-a1b2c3d4' })
  expertId: string;

  @ApiProperty({ example: 'Neha Verma' })
  hostName: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;
}

