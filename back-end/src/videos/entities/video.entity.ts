import { ApiProperty } from '@nestjs/swagger';

export class VideoEntity {
  @ApiProperty({ example: 'video-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'Mindful Breathing for Busy Days' })
  title: string;

  @ApiProperty({ example: 'Mind Relaxation' })
  category: string;

  @ApiProperty({ example: '12:45' })
  duration: string;

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=inpok4MKVLM' })
  videoLink: string;

  @ApiProperty({
    example:
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=900&q=80',
  })
  thumbnailLink: string;

  @ApiProperty({ example: 'A short guided reset for stress and focus.' })
  description: string;

  @ApiProperty({ example: '2026-05-03T10:15:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: 'expert-1777718400000-a1b2c3d4' })
  creatorExpertId: string;

  @ApiProperty({ example: 'Dr. Emily Chen' })
  creatorExpertName: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;
}
