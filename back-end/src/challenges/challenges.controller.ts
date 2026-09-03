import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../common/constants/roles';
import { ApiRoleHeader } from '../common/decorators/api-role-header.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeEntity } from './entities/challenge.entity';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List challenges' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'creatorHrId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiOkResponse({ type: ChallengeEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll(
    @Query('type') type?: string,
    @Query('creatorHrId') creatorHrId?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
  ) {
    return this.challengesService.findAll({
      type,
      creatorHrId,
      companyId,
      companyName,
    });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a challenge by id' })
  @ApiOkResponse({ type: ChallengeEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a challenge' })
  @ApiCreatedResponse({ type: ChallengeEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted challenge payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() createChallengeDto: CreateChallengeDto) {
    return this.challengesService.create(createChallengeDto);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update a challenge' })
  @ApiOkResponse({ type: ChallengeEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted challenge payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  update(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ) {
    return this.challengesService.update(id, updateChallengeDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a challenge' })
  @ApiOkResponse({ type: ChallengeEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  remove(@Param('id') id: string) {
    return this.challengesService.remove(id);
  }
}
