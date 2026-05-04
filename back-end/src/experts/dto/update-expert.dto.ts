import { PartialType } from '@nestjs/swagger';
import { CreateExpertDto } from './create-expert.dto';

export class UpdateExpertDto extends PartialType(CreateExpertDto) {}

