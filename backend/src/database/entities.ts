import { UserEntity } from "@/features/auth/user.entity";
import { SessionEntity } from "@/features/auth/session.entity";
import { OrganizationEntity } from "@/features/organizations/organization.entity";
import { OpportunityEntity } from "@/features/opportunities/opportunity.entity";
import { ActivitySessionEntity } from "@/features/opportunities/activity-session.entity";
import { EnrollmentEntity } from "@/features/opportunities/enrollment.entity";
import { SubmissionEntity } from "@/features/certificates/submission.entity";
import { ParticipationCertificateEntity } from "@/features/certificates/participation-certificate.entity";

export const entities = [UserEntity, SessionEntity, OrganizationEntity, OpportunityEntity,
  ActivitySessionEntity, EnrollmentEntity, SubmissionEntity, ParticipationCertificateEntity];
