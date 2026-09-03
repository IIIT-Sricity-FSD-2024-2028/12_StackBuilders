import { PartialType } from '@nestjs/swagger';
import { CreateCheckinResponseDto } from './create-checkin-response.dto';

export class UpdateCheckinResponseDto extends PartialType(
  CreateCheckinResponseDto,
) {}

