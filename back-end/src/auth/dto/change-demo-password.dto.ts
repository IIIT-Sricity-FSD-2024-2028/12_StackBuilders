import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangeDemoPasswordDto {
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(128)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword: string;
}
