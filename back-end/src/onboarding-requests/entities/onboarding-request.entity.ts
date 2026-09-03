import { ApiProperty } from '@nestjs/swagger';

export class OnboardingRequestEntity {
  @ApiProperty({ example: 'request-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;

  @ApiProperty({ example: '+91 98765 43210' })
  companyPhone: string;

  @ApiProperty({ example: 'Bengaluru, Karnataka' })
  companyAddress: string;

  @ApiProperty({ example: 'contact@stackbuilders.com' })
  companyEmail: string;

  @ApiProperty({ example: 'Priya Sharma' })
  hrName: string;

  @ApiProperty({ example: 'priya.sharma@gmail.com' })
  hrEmail: string;

  @ApiProperty({ example: 'secure123' })
  hrPassword: string;

  @ApiProperty({ example: '+91 98765 43210' })
  hrPhoneNumber: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: '2026-05-02T12:30:00.000Z' })
  createdAt: string;
}

