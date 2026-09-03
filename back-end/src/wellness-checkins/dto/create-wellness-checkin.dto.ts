import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWellnessCheckinDto {
  @ApiProperty({ example: 'mental' })
  @IsString()
  @IsNotEmpty()
  checkinType: string;

  @ApiPropertyOptional({ example: 'employee-1777718400000-a1b2c3d4' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: 'Aarav Sharma' })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiPropertyOptional({ example: 'aarav.sharma@gmail.com' })
  @IsOptional()
  @IsString()
  employeeEmail?: string;

  @ApiPropertyOptional({ example: 'CMP-1001' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ example: 'Stack Builders Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Feeling low after a stressful deadline.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '4' })
  @IsOptional()
  @IsString()
  moodScore?: string;

  @ApiPropertyOptional({ example: '8' })
  @IsOptional()
  @IsString()
  stressScore?: string;

  @ApiPropertyOptional({ example: '5.5' })
  @IsOptional()
  @IsString()
  sleepHours?: string;

  @ApiPropertyOptional({ example: '3' })
  @IsOptional()
  @IsString()
  focusScore?: string;

  @ApiPropertyOptional({ example: 'Project deadlines' })
  @IsOptional()
  @IsString()
  anxietyTrigger?: string;

  @ApiPropertyOptional({ example: 'Need support as soon as possible' })
  @IsOptional()
  @IsString()
  supportNeeded?: string;

  @ApiPropertyOptional({ example: '6' })
  @IsOptional()
  @IsString()
  mealConsistency?: string;

  @ApiPropertyOptional({ example: '2.2' })
  @IsOptional()
  @IsString()
  waterIntakeLiters?: string;

  @ApiPropertyOptional({ example: '7' })
  @IsOptional()
  @IsString()
  energyScore?: string;

  @ApiPropertyOptional({ example: '4' })
  @IsOptional()
  @IsString()
  servingsCount?: string;

  @ApiPropertyOptional({ example: 'More energy during work' })
  @IsOptional()
  @IsString()
  nutritionGoal?: string;

  @ApiPropertyOptional({ example: 'Skipped breakfast' })
  @IsOptional()
  @IsString()
  dietChallenge?: string;

  @ApiPropertyOptional({ example: '45' })
  @IsOptional()
  @IsString()
  activityMinutes?: string;

  @ApiPropertyOptional({ example: '8500' })
  @IsOptional()
  @IsString()
  stepCount?: string;

  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  painScore?: string;

  @ApiPropertyOptional({ example: '8' })
  @IsOptional()
  @IsString()
  mobilityScore?: string;

  @ApiPropertyOptional({ example: '7' })
  @IsOptional()
  @IsString()
  recoveryScore?: string;

  @ApiPropertyOptional({ example: 'Walking or cardio' })
  @IsOptional()
  @IsString()
  workoutFocus?: string;
}

