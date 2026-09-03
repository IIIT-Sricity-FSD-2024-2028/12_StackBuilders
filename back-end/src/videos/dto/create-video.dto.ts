import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVideoDto {
  @ApiProperty({ example: 'Mindful Breathing for Busy Days' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Mind Relaxation' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '12:45' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=inpok4MKVLM' })
  @IsString()
  @IsNotEmpty()
  videoLink: string;

  @ApiProperty({
    example:
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=900&q=80',
  })
  @IsString()
  @IsNotEmpty()
  thumbnailLink: string;

  @ApiProperty({ example: 'A short guided reset for stress and focus.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'expert-1777718400000-a1b2c3d4' })
  @IsOptional()
  @IsString()
  creatorExpertId?: string;

  @ApiPropertyOptional({ example: 'Dr. Emily Chen' })
  @IsOptional()
  @IsString()
  creatorExpertName?: string;

  @ApiPropertyOptional({ example: 'CMP-1001' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ example: 'Stack Builders Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;
}
