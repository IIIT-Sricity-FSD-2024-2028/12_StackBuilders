import { ApiProperty } from '@nestjs/swagger';

export class CheckinResponseEntity {
  @ApiProperty({ example: 'response-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'checkin-1777718400000-a1b2c3d4' })
  checkinId: string;

  @ApiProperty({ example: 'mental' })
  checkinType: string;

  @ApiProperty({ example: 'employee-1777718400000-a1b2c3d4' })
  employeeId: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  employeeName: string;

  @ApiProperty({ example: 'expert-1777718400000-a1b2c3d4' })
  expertId: string;

  @ApiProperty({ example: 'Neha Verma' })
  expertName: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;

  @ApiProperty({ example: 'Please take a short break and let us follow up tomorrow.' })
  message: string;

  @ApiProperty({ example: '2026-05-02T12:45:00.000Z' })
  createdAt: string;
}

