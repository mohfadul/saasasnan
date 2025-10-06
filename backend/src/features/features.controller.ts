import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../tenants/tenant.guard';
import { User } from '../auth/entities/user.entity';
import { FeatureFlagsService, FeatureFlagEvaluationRequest } from './feature-flags.service';
import { ABTestingService, ABTestCreationRequest, ConversionEvent } from './ab-testing.service';
import { FeatureFlag, FeatureFlagType, FeatureFlagStatus, FeatureFlagRolloutStrategy } from './entities/feature-flag.entity';
import { ABTest, ABTestStatus, ABTestType } from './entities/ab-test.entity';

@ApiTags('Feature Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('features')
export class FeaturesController {
  constructor(
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly abTestingService: ABTestingService,
  ) {}

  // Feature Flag Endpoints
  @Post('flags')
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({ status: 201, description: 'Feature flag created successfully' })
  async createFeatureFlag(
    @Request() req: { user: User },
    @Body() createFlagDto: {
      key: string;
      name: string;
      description?: string;
      type: FeatureFlagType;
      default_value: any;
      rollout_strategy: FeatureFlagRolloutStrategy;
      rollout_config: Record<string, any>;
      targeting_rules?: Record<string, any>;
      variants?: Record<string, any>;
      is_experiment?: boolean;
      experiment_config?: Record<string, any>;
    },
  ): Promise<FeatureFlag> {
    return await this.featureFlagsService.createFeatureFlag(
      req.user.tenant_id, // This would come from the tenant guard
      createFlagDto,
    );
  }

  @Get('flags')
  @ApiOperation({ summary: 'Get all feature flags for tenant' })
  @ApiResponse({ status: 200, description: 'Feature flags retrieved successfully' })
  async getFeatureFlags(
    @Query('status') status?: FeatureFlagStatus,
    @Query('type') type?: FeatureFlagType,
  ): Promise<FeatureFlag[]> {
    // Implementation would depend on your repository setup
    return [];
  }

  @Get('flags/:id')
  @ApiOperation({ summary: 'Get feature flag by ID' })
  @ApiResponse({ status: 200, description: 'Feature flag retrieved successfully' })
  async getFeatureFlag(@Param('id') id: string): Promise<FeatureFlag> {
    // Implementation would depend on your repository setup
    throw new Error('Not implemented');
  }

  @Put('flags/:id')
  @ApiOperation({ summary: 'Update feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag updated successfully' })
  async updateFeatureFlag(
    @Param('id') id: string,
    @Body() updateData: Partial<FeatureFlag>,
  ): Promise<FeatureFlag> {
    return await this.featureFlagsService.updateFeatureFlag(
      id,
      updateData.tenant_id, // This would come from the tenant guard
      updateData,
    );
  }

  @Post('flags/:id/activate')
  @ApiOperation({ summary: 'Activate feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag activated successfully' })
  async activateFeatureFlag(@Param('id') id: string): Promise<FeatureFlag> {
    return await this.featureFlagsService.activateFeatureFlag(
      id,
      '', // This would come from the tenant guard
    );
  }

  @Post('flags/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag deactivated successfully' })
  async deactivateFeatureFlag(@Param('id') id: string): Promise<FeatureFlag> {
    return await this.featureFlagsService.deactivateFeatureFlag(
      id,
      '', // This would come from the tenant guard
    );
  }

  @Post('flags/:id/analytics')
  @ApiOperation({ summary: 'Get feature flag analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getFeatureFlagAnalytics(@Param('id') id: string): Promise<any> {
    return await this.featureFlagsService.getFlagAnalytics(
      id,
      '', // This would come from the tenant guard
    );
  }

  // Feature Flag Evaluation
  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate feature flags' })
  @ApiResponse({ status: 200, description: 'Feature flags evaluated successfully' })
  async evaluateFeatureFlag(@Body() request: FeatureFlagEvaluationRequest): Promise<any> {
    return await this.featureFlagsService.evaluateFeatureFlag(request);
  }

  @Post('evaluate/bulk')
  @ApiOperation({ summary: 'Evaluate multiple feature flags' })
  @ApiResponse({ status: 200, description: 'Feature flags evaluated successfully' })
  async evaluateMultipleFlags(
    @Body() requests: Omit<FeatureFlagEvaluationRequest, 'tenant_id'>[],
  ): Promise<Record<string, any>> {
    return await this.featureFlagsService.evaluateMultipleFlags(
      '', // This would come from the tenant guard
      requests,
    );
  }

  // AB Testing Endpoints
  @Post('ab-tests')
  @ApiOperation({ summary: 'Create a new AB test' })
  @ApiResponse({ status: 201, description: 'AB test created successfully' })
  async createABTest(@Body() createTestDto: ABTestCreationRequest): Promise<ABTest> {
    return await this.abTestingService.createABTest(createTestDto);
  }

  @Get('ab-tests')
  @ApiOperation({ summary: 'Get all AB tests for tenant' })
  @ApiResponse({ status: 200, description: 'AB tests retrieved successfully' })
  async getABTests(
    @Query('status') status?: ABTestStatus,
    @Query('type') type?: ABTestType,
  ): Promise<ABTest[]> {
    return await this.abTestingService.getABTestsByTenant(
      '', // This would come from the tenant guard
      status,
    );
  }

  @Get('ab-tests/:id')
  @ApiOperation({ summary: 'Get AB test by ID' })
  @ApiResponse({ status: 200, description: 'AB test retrieved successfully' })
  async getABTest(@Param('id') id: string): Promise<ABTest> {
    return await this.abTestingService.getABTestResults(
      id,
      '', // This would come from the tenant guard
    );
  }

  @Post('ab-tests/:id/start')
  @ApiOperation({ summary: 'Start AB test' })
  @ApiResponse({ status: 200, description: 'AB test started successfully' })
  async startABTest(@Param('id') id: string): Promise<ABTest> {
    return await this.abTestingService.startABTest(
      id,
      '', // This would come from the tenant guard
    );
  }

  @Post('ab-tests/:id/stop')
  @ApiOperation({ summary: 'Stop AB test' })
  @ApiResponse({ status: 200, description: 'AB test stopped successfully' })
  async stopABTest(@Param('id') id: string): Promise<ABTest> {
    return await this.abTestingService.stopABTest(
      id,
      '', // This would come from the tenant guard
    );
  }

  @Get('ab-tests/:id/participants')
  @ApiOperation({ summary: 'Get AB test participant statistics' })
  @ApiResponse({ status: 200, description: 'Participant statistics retrieved successfully' })
  async getABTestParticipants(@Param('id') id: string): Promise<any> {
    return await this.abTestingService.getParticipantStats(id);
  }

  @Post('ab-tests/assign')
  @ApiOperation({ summary: 'Assign user to AB test' })
  @ApiResponse({ status: 200, description: 'User assigned to AB test successfully' })
  async assignParticipant(
    @Body() assignmentRequest: {
      ab_test_id: string;
      user_id: string;
      session_id?: string;
      device_id?: string;
      user_attributes?: Record<string, any>;
      device_info?: Record<string, any>;
    },
  ): Promise<any> {
    return await this.abTestingService.assignParticipant(assignmentRequest);
  }

  @Post('ab-tests/track-conversion')
  @ApiOperation({ summary: 'Track conversion event for AB test' })
  @ApiResponse({ status: 200, description: 'Conversion tracked successfully' })
  @HttpCode(HttpStatus.OK)
  async trackConversion(@Body() event: ConversionEvent): Promise<void> {
    await this.abTestingService.trackConversion(event);
  }

  // Cache Management
  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear feature flag cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  @HttpCode(HttpStatus.OK)
  async clearCache(): Promise<void> {
    this.featureFlagsService.clearCache();
  }

  @Post('cache/clear/:tenantId')
  @ApiOperation({ summary: 'Clear feature flag cache for specific tenant' })
  @ApiResponse({ status: 200, description: 'Tenant cache cleared successfully' })
  @HttpCode(HttpStatus.OK)
  async clearTenantCache(@Param('tenantId') tenantId: string): Promise<void> {
    this.featureFlagsService.clearCacheForTenant(tenantId);
  }

  // Maintenance
  @Post('maintenance/cleanup')
  @ApiOperation({ summary: 'Run maintenance cleanup tasks' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async runMaintenance(): Promise<{ expired_tests_archived: number }> {
    const expiredTestsArchived = await this.abTestingService.cleanupExpiredTests();
    return { expired_tests_archived: expiredTestsArchived };
  }
}
