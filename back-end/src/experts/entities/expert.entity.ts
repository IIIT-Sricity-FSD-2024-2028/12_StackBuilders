import { ApiProperty } from '@nestjs/swagger';

export class ExpertEntity {
  @ApiProperty({ example: 'expert-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'Neha Verma' })
  name: string;

  @ApiProperty({ example: 'neha.verma@gmail.com' })
  email: string;

  @ApiProperty({ example: 'neha.verma@gmail.com' })
  username: string;

  @ApiProperty({ example: 'secure123' })
  password: string;

  @ApiProperty({ example: 'Nutritionist' })
  specialization: string;

  @ApiProperty({ example: '5' })
  experience: string;

  @ApiProperty({ example: '+91 98765 43210' })
  phoneNumber: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;

  @ApiProperty({ example: 'Active' })
  status: string;

  @ApiProperty({ example: '2026-05-02T12:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-02T12:45:00.000Z' })
  updatedAt: string;
}

