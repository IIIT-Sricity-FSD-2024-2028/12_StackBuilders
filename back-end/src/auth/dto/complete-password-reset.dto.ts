import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CompletePasswordResetDto {
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword: string;
}
