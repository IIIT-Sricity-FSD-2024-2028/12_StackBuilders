import { ApiProperty } from '@nestjs/swagger';

export class ConsultationEntity {
  @ApiProperty({ example: 'consult-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'employee-1777718400000-a1b2c3d4' })
  employeeId: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  employeeName: string;

  @ApiProperty({ example: 'expert-1777718400000-a1b2c3d4' })
  expertId: string;

  @ApiProperty({ example: 'Neha Verma' })
  expertName: string;

  @ApiProperty({ example: 'Need guidance for nutrition planning.' })
  purpose: string;

  @ApiProperty({ example: 'Nutritionist' })
  category: string;

  @ApiProperty({ example: '02 May 2026 @ 6:15 pm' })
  requestedOn: string;

  @ApiProperty({ example: 'requested' })
  status: string;

  @ApiProperty({ example: '' })
  rejectionReason: string;

  @ApiProperty({ example: 'Nutrition Consultation with Aarav Sharma' })
  sessionTitle: string;

  @ApiProperty({ example: '2026-05-03' })
  sessionDate: string;

  @ApiProperty({ example: '18:30' })
  sessionTime: string;

  @ApiProperty({ example: '45 min' })
  sessionDuration: string;

  @ApiProperty({ example: 'https://meet.example.com/session' })
  sessionMeetingLink: string;

  @ApiProperty({ example: '2026-05-02T13:00:00.000Z' })
  sessionCreatedAt: string;

  @ApiProperty({ example: false })
  createdByExpert: boolean;

  @ApiProperty({ example: 'checkin-1777718400000-a1b2c3d4' })
  sourceCheckinId: string;

  @ApiProperty({ example: 'high' })
  followUpPriority: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;

  @ApiProperty({ example: '2026-05-02T12:30:00.000Z' })
  createdAt: string;
}

