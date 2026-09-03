import { ApiProperty } from '@nestjs/swagger';

export class HrProfileEntity {
  @ApiProperty({ example: 'hr-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'Priya Sharma' })
  name: string;

  @ApiProperty({ example: 'priya.sharma@gmail.com' })
  email: string;

  @ApiProperty({ example: 'priya.sharma@gmail.com' })
  username: string;

  @ApiProperty({ example: '+91 98765 43210' })
  phoneNumber: string;

  @ApiProperty({ example: 'Operations' })
  department: string;

  @ApiProperty({ example: 'HR Manager' })
  designation: string;

  @ApiProperty({ example: 'Bengaluru' })
  location: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;

  @ApiProperty({ example: 'Active' })
  status: string;

  @ApiProperty({ example: true })
  createdBySuperUser: boolean;

  @ApiProperty({ example: 'secure123' })
  password: string;

  @ApiProperty({ example: '2026-05-02T12:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-02T12:30:00.000Z' })
  updatedAt: string;
}

