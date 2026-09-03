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
import { ClaimRewardDto } from './dto/claim-reward.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RewardClaimResultEntity } from './entities/reward-claim-result.entity';
import { RewardEntity } from './entities/reward.entity';
import { RewardsService } from './rewards.service';

@ApiTags('rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List rewards' })
  @ApiQuery({ name: 'creatorHrId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiOkResponse({ type: RewardEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll(
    @Query('creatorHrId') creatorHrId?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
  ) {
    return this.rewardsService.findAll({
      creatorHrId,
      companyId,
      companyName,
    });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a reward by id' })
  @ApiOkResponse({ type: RewardEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Reward not found.' })
  findOne(@Param('id') id: string) {
    return this.rewardsService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a reward' })
  @ApiCreatedResponse({ type: RewardEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted reward payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() createRewardDto: CreateRewardDto) {
    return this.rewardsService.create(createRewardDto);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update a reward' })
  @ApiOkResponse({ type: RewardEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted reward payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Reward not found.' })
  update(@Param('id') id: string, @Body() updateRewardDto: UpdateRewardDto) {
    return this.rewardsService.update(id, updateRewardDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a reward' })
  @ApiOkResponse({ type: RewardEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Reward not found.' })
  remove(@Param('id') id: string) {
    return this.rewardsService.remove(id);
  }

  @Post(':id/claim')
  @Roles(Role.Employee)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Claim a reward for an employee' })
  @ApiOkResponse({ type: RewardClaimResultEntity })
  @ApiBadRequestResponse({
    description:
      'Validation failed, the reward is already claimed, or the employee does not have enough points.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({
    description: 'Reward or employee was not found.',
  })
  claim(@Param('id') id: string, @Body() claimRewardDto: ClaimRewardDto) {
    return this.rewardsService.claimReward(id, claimRewardDto.employeeId);
  }
}
