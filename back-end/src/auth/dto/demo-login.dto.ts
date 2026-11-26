import { IsEmail, IsString, MaxLength } from 'class-validator';

export class DemoLoginDto {
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(128)
  password: string;
}
