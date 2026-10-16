import { IsOptional } from 'class-validator';

export class QueryDto {
  @IsOptional()
  id?: string;
  @IsOptional()
  userId?: string;
  @IsOptional()
  userEmail?: string;
  @IsOptional()
  userName?: string;
  @IsOptional()
  userType?: string;
  @IsOptional()
  companyId?: string;
  @IsOptional()
  companyName?: string;
  @IsOptional()
  description?: string;
  @IsOptional()
  status?: string;
  @IsOptional()
  reply?: string;
  @IsOptional()
  createdAt?: number;
  @IsOptional()
  readBySender?: boolean;
  @IsOptional()
  repliedAt?: number;
}
