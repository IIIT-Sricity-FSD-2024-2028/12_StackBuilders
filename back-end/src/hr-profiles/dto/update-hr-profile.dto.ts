import { PartialType } from '@nestjs/swagger';
import { CreateHrProfileDto } from './create-hr-profile.dto';

export class UpdateHrProfileDto extends PartialType(CreateHrProfileDto) {}

