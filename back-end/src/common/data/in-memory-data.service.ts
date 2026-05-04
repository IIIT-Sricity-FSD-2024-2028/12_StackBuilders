import { Injectable } from '@nestjs/common';
import { CompanyEntity } from '../../companies/entities/company.entity';
import { ConsultationEntity } from '../../consultations/entities/consultation.entity';
import { CheckinResponseEntity } from '../../checkin-responses/entities/checkin-response.entity';
import { ChallengeEntity } from '../../challenges/entities/challenge.entity';
import { EmployeeEntity } from '../../employees/entities/employee.entity';
import { ExpertEntity } from '../../experts/entities/expert.entity';
import { HrProfileEntity } from '../../hr-profiles/entities/hr-profile.entity';
import { LiveSessionEntity } from '../../live-sessions/entities/live-session.entity';
import { OnboardingRequestEntity } from '../../onboarding-requests/entities/onboarding-request.entity';
import { RewardEntity } from '../../rewards/entities/reward.entity';
import { VideoEntity } from '../../videos/entities/video.entity';
import { WellnessCheckinEntity } from '../../wellness-checkins/entities/wellness-checkin.entity';
import { RolePermissionGroup } from '../../role-permissions/constants/role-permission-defaults';

@Injectable()
export class InMemoryDataService {
  readonly companies: CompanyEntity[] = [];

  readonly hrProfiles: HrProfileEntity[] = [];

  readonly onboardingRequests: OnboardingRequestEntity[] = [];

  readonly employees: EmployeeEntity[] = [];

  readonly experts: ExpertEntity[] = [];

  readonly consultations: ConsultationEntity[] = [];

  readonly wellnessCheckins: WellnessCheckinEntity[] = [];

  readonly checkinResponses: CheckinResponseEntity[] = [];

  readonly liveSessions: LiveSessionEntity[] = [];

  readonly videos: VideoEntity[] = [];

  readonly challenges: ChallengeEntity[] = [];

  readonly rewards: RewardEntity[] = [];

  readonly rolePermissions: Partial<
    Record<RolePermissionGroup, Record<string, boolean>>
  > = {};
}
