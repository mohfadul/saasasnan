import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PatientsModule } from '../patients/patients.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BillingModule } from '../billing/billing.module';
import { ClinicalModule } from '../clinical/clinical.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AIModule } from '../ai/ai.module';
import { FeaturesModule } from '../features/features.module';

export interface TestContext {
  app: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
  jwtService: JwtService;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5432'),
        username: process.env.TEST_DB_USERNAME || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'postgres',
        database: process.env.TEST_DB_NAME || 'healthcare_test',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
        dropSchema: true,
        logging: false,
      }),
      AppModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const dataSource = moduleFixture.get<DataSource>(DataSource);
  const jwtService = moduleFixture.get<JwtService>(JwtService);

  await app.init();

  return {
    app,
    module: moduleFixture,
    dataSource,
    jwtService,
  };
}

export async function cleanupTestApp(context: TestContext): Promise<void> {
  await context.app.close();
  await context.module.close();
}

export async function seedTestData(dataSource: DataSource): Promise<any> {
  // Create test tenant
  const tenantResult = await dataSource.query(`
    INSERT INTO tenants (id, name, subdomain, config, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Test Clinic', 'test-clinic', '{}', NOW(), NOW())
    RETURNING id, name, subdomain
  `);

  const tenant = tenantResult[0];

  // Create test user
  const userResult = await dataSource.query(`
    INSERT INTO users (id, tenant_id, email, role, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, 'test@testclinic.com', 'hospital_admin', NOW(), NOW())
    RETURNING id, email, role
  `, [tenant.id]);

  const user = userResult[0];

  // Create test patient
  const patientResult = await dataSource.query(`
    INSERT INTO patients (id, tenant_id, clinic_id, encrypted_demographics, demographics_key_id, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, $1, $2, 'test-key', NOW(), NOW())
    RETURNING id
  `, [tenant.id, Buffer.from(JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-01',
    phone_number: '+1234567890',
    email: 'john.doe@example.com',
  }))]);

  const patient = patientResult[0];

  return {
    tenant,
    user,
    patient,
  };
}

export function createTestJwtToken(jwtService: JwtService, payload: any): string {
  return jwtService.sign(payload);
}

export function getTestHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Test utilities
export class TestUtils {
  static async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateRandomEmail(): string {
    return `test-${Math.random().toString(36).substring(7)}@example.com`;
  }

  static generateRandomPhone(): string {
    return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }

  static generateRandomDateOfBirth(): string {
    const start = new Date(1950, 0, 1);
    const end = new Date(2000, 11, 31);
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().split('T')[0];
  }

  static async truncateAllTables(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }

  static async disableForeignKeys(dataSource: DataSource): Promise<void> {
    await dataSource.query('SET session_replication_role = replica;');
  }

  static async enableForeignKeys(dataSource: DataSource): Promise<void> {
    await dataSource.query('SET session_replication_role = DEFAULT;');
  }
}
