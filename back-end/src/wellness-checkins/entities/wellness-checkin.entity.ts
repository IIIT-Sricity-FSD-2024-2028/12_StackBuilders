import { ApiProperty } from '@nestjs/swagger';

export class WellnessCheckinEntity {
  @ApiProperty({ example: 'checkin-1777718400000-a1b2c3d4' })
  id: string;

  @ApiProperty({ example: 'mental' })
  checkinType: string;

  @ApiProperty({ example: 'employee-1777718400000-a1b2c3d4' })
  employeeId: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  employeeName: string;

  @ApiProperty({ example: 'aarav.sharma@gmail.com' })
  employeeEmail: string;

  @ApiProperty({ example: 'CMP-1001' })
  companyId: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  companyName: string;

  @ApiProperty({ example: 'Feeling low after a stressful deadline.' })
  notes: string;

  @ApiProperty({ example: '2026-05-02T12:30:00.000Z' })
  submittedAt: string;

  @ApiProperty({ example: '4' })
  moodScore: string;

  @ApiProperty({ example: '8' })
  stressScore: string;

  @ApiProperty({ example: '5.5' })
  sleepHours: string;

  @ApiProperty({ example: '3' })
  focusScore: string;

  @ApiProperty({ example: 'Project deadlines' })
  anxietyTrigger: string;

  @ApiProperty({ example: 'Need support as soon as possible' })
  supportNeeded: string;

  @ApiProperty({ example: '6' })
  mealConsistency: string;

  @ApiProperty({ example: '2.2' })
  waterIntakeLiters: string;

  @ApiProperty({ example: '7' })
  energyScore: string;

  @ApiProperty({ example: '4' })
  servingsCount: string;

  @ApiProperty({ example: 'More energy during work' })
  nutritionGoal: string;

  @ApiProperty({ example: 'Skipped breakfast' })
  dietChallenge: string;

  @ApiProperty({ example: '45' })
  activityMinutes: string;

  @ApiProperty({ example: '8500' })
  stepCount: string;

  @ApiProperty({ example: '2' })
  painScore: string;

  @ApiProperty({ example: '8' })
  mobilityScore: string;

  @ApiProperty({ example: '7' })
  recoveryScore: string;

  @ApiProperty({ example: 'Walking or cardio' })
  workoutFocus: string;
}

