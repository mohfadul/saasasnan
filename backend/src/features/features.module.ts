import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeaturesController } from './features.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { ABTestingService } from './ab-testing.service';
import { FeatureFlag } from './entities/feature-flag.entity';
import { FeatureFlagEvaluation } from './entities/feature-flag-evaluation.entity';
import { ABTest } from './entities/ab-test.entity';
import { ABTestParticipant } from './entities/ab-test-participant.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureFlag,
      FeatureFlagEvaluation,
      ABTest,
      ABTestParticipant,
      Tenant,
      User,
    ]),
  ],
  controllers: [FeaturesController],
  providers: [FeatureFlagsService, ABTestingService],
  exports: [FeatureFlagsService, ABTestingService],
})
export class FeaturesModule {}
