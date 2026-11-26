import { IsEmail, IsString, MaxLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email: string;
}
