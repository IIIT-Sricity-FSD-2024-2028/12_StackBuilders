import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Bengaluru, Karnataka' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'contact@stackbuilders.com' })
  @IsEmail()
  email: string;
}

