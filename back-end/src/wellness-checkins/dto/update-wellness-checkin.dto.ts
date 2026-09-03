import { PartialType } from '@nestjs/swagger';
import { CreateWellnessCheckinDto } from './create-wellness-checkin.dto';

export class UpdateWellnessCheckinDto extends PartialType(
  CreateWellnessCheckinDto,
) {}

