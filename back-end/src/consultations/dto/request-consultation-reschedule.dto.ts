import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestConsultationRescheduleDto {
  @ApiProperty({ example: 'employee-1777718400000-a1b2c3d4' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    example: 'I am unavailable at this time. Could we meet tomorrow afternoon?',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}
