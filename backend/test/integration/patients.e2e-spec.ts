import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { createTestApp, cleanupTestApp, seedTestData, createTestJwtToken, getTestHeaders, TestUtils } from '../../src/testing/test-setup';

describe('Patients (e2e)', () => {
  let app: INestApplication;
  let testData: any;
  let authToken: string;

  beforeAll(async () => {
    const context = await createTestApp();
    app = context.app;
    testData = await seedTestData(context.dataSource);
    authToken = createTestJwtToken(context.jwtService, {
      sub: testData.user.id,
      email: testData.user.email,
      role: testData.user.role,
      tenant_id: testData.tenant.id,
    });
  });

  afterAll(async () => {
    await cleanupTestApp({ app } as any);
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await TestUtils.truncateAllTables((app as any).dataSource);
    testData = await seedTestData((app as any).dataSource);
  });

  describe('/patients (POST)', () => {
    it('should create a new patient', async () => {
      const createPatientDto = {
        clinic_id: testData.tenant.id,
        patient_external_id: 'EXT-001',
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zip_code: '12345',
            country: 'USA',
          },
        },
        tags: ['vip'],
        consent_flags: { marketing: true },
        medical_alert_flags: { allergies: true },
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set(getTestHeaders(authToken))
        .send(createPatientDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('patient_external_id', 'EXT-001');
      expect(response.body).toHaveProperty('tags', ['vip']);
      expect(response.body).toHaveProperty('consent_flags', { marketing: true });
      expect(response.body).toHaveProperty('medical_alert_flags', { allergies: true });
      expect(response.body).toHaveProperty('created_by', testData.user.id);
    });

    it('should return 400 for invalid patient data', async () => {
      const invalidPatientDto = {
        clinic_id: testData.tenant.id,
        demographics: {
          // Missing required fields
        },
      };

      await request(app.getHttpServer())
        .post('/patients')
        .set(getTestHeaders(authToken))
        .send(invalidPatientDto)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const createPatientDto = {
        clinic_id: testData.tenant.id,
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
        },
      };

      await request(app.getHttpServer())
        .post('/patients')
        .send(createPatientDto)
        .expect(401);
    });
  });

  describe('/patients (GET)', () => {
    beforeEach(async () => {
      // Create test patients
      const patients = [
        {
          clinic_id: testData.tenant.id,
          patient_external_id: 'EXT-001',
          demographics: {
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '1990-01-01',
            phone_number: '+1234567890',
            email: 'john.doe@example.com',
          },
          tags: ['vip'],
        },
        {
          clinic_id: testData.tenant.id,
          patient_external_id: 'EXT-002',
          demographics: {
            first_name: 'Jane',
            last_name: 'Smith',
            date_of_birth: '1985-05-15',
            phone_number: '+1234567891',
            email: 'jane.smith@example.com',
          },
          tags: ['premium'],
        },
      ];

      for (const patientData of patients) {
        await request(app.getHttpServer())
          .post('/patients')
          .set(getTestHeaders(authToken))
          .send(patientData);
      }
    });

    it('should return all patients for the tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/patients')
        .set(getTestHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('patients');
      expect(response.body.patients).toHaveLength(2);
      expect(response.body).toHaveProperty('total', 2);
    });

    it('should filter patients by clinic_id', async () => {
      const response = await request(app.getHttpServer())
        .get('/patients')
        .query({ clinic_id: testData.tenant.id })
        .set(getTestHeaders(authToken))
        .expect(200);

      expect(response.body.patients).toHaveLength(2);
    });

    it('should filter patients by tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/patients')
        .query({ tags: 'vip' })
        .set(getTestHeaders(authToken))
        .expect(200);

      expect(response.body.patients).toHaveLength(1);
      expect(response.body.patients[0].tags).toContain('vip');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/patients')
        .query({ limit: 1, offset: 0 })
        .set(getTestHeaders(authToken))
        .expect(200);

      expect(response.body.patients).toHaveLength(1);
      expect(response.body).toHaveProperty('limit', 1);
      expect(response.body).toHaveProperty('offset', 0);
      expect(response.body).toHaveProperty('total', 2);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/patients')
        .expect(401);
    });
  });

  describe('/patients/:id (GET)', () => {
    let patientId: string;

    beforeEach(async () => {
      const createPatientDto = {
        clinic_id: testData.tenant.id,
        patient_external_id: 'EXT-001',
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
        },
        tags: ['vip'],
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set(getTestHeaders(authToken))
        .send(createPatientDto);

      patientId = response.body.id;
    });

    it('should return a specific patient', async () => {
      const response = await request(app.getHttpServer())
        .get(`/patients/${patientId}`)
        .set(getTestHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('id', patientId);
      expect(response.body).toHaveProperty('patient_external_id', 'EXT-001');
      expect(response.body).toHaveProperty('demographics');
      expect(response.body.demographics).toHaveProperty('first_name', 'John');
      expect(response.body.demographics).toHaveProperty('last_name', 'Doe');
      expect(response.body).toHaveProperty('tags', ['vip']);
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app.getHttpServer())
        .get('/patients/non-existent-id')
        .set(getTestHeaders(authToken))
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/patients/${patientId}`)
        .expect(401);
    });
  });

  describe('/patients/:id (PUT)', () => {
    let patientId: string;

    beforeEach(async () => {
      const createPatientDto = {
        clinic_id: testData.tenant.id,
        patient_external_id: 'EXT-001',
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
        },
        tags: ['vip'],
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set(getTestHeaders(authToken))
        .send(createPatientDto);

      patientId = response.body.id;
    });

    it('should update a patient', async () => {
      const updatePatientDto = {
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
          address: {
            street: '456 Oak Ave',
            city: 'Newtown',
            state: 'NY',
            zip_code: '67890',
            country: 'USA',
          },
        },
        tags: ['vip', 'premium'],
        consent_flags: { marketing: true },
      };

      const response = await request(app.getHttpServer())
        .put(`/patients/${patientId}`)
        .set(getTestHeaders(authToken))
        .send(updatePatientDto)
        .expect(200);

      expect(response.body).toHaveProperty('id', patientId);
      expect(response.body).toHaveProperty('tags', ['vip', 'premium']);
      expect(response.body).toHaveProperty('consent_flags', { marketing: true });
      expect(response.body.demographics.address.street).toBe('456 Oak Ave');
    });

    it('should return 404 for non-existent patient', async () => {
      const updatePatientDto = {
        tags: ['updated'],
      };

      await request(app.getHttpServer())
        .put('/patients/non-existent-id')
        .set(getTestHeaders(authToken))
        .send(updatePatientDto)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const updatePatientDto = {
        tags: ['updated'],
      };

      await request(app.getHttpServer())
        .put(`/patients/${patientId}`)
        .send(updatePatientDto)
        .expect(401);
    });
  });

  describe('/patients/:id (DELETE)', () => {
    let patientId: string;

    beforeEach(async () => {
      const createPatientDto = {
        clinic_id: testData.tenant.id,
        patient_external_id: 'EXT-001',
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set(getTestHeaders(authToken))
        .send(createPatientDto);

      patientId = response.body.id;
    });

    it('should soft delete a patient', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/patients/${patientId}`)
        .set(getTestHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('deleted_at');
      expect(response.body.deleted_at).not.toBeNull();
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app.getHttpServer())
        .delete('/patients/non-existent-id')
        .set(getTestHeaders(authToken))
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/patients/${patientId}`)
        .expect(401);
    });
  });

  describe('/patients/:id/restore (POST)', () => {
    let patientId: string;

    beforeEach(async () => {
      const createPatientDto = {
        clinic_id: testData.tenant.id,
        patient_external_id: 'EXT-001',
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set(getTestHeaders(authToken))
        .send(createPatientDto);

      patientId = response.body.id;

      // Soft delete the patient
      await request(app.getHttpServer())
        .delete(`/patients/${patientId}`)
        .set(getTestHeaders(authToken));
    });

    it('should restore a soft deleted patient', async () => {
      const response = await request(app.getHttpServer())
        .post(`/patients/${patientId}/restore`)
        .set(getTestHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('deleted_at', null);
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app.getHttpServer())
        .post('/patients/non-existent-id/restore')
        .set(getTestHeaders(authToken))
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/patients/${patientId}/restore`)
        .expect(401);
    });
  });

  describe('PHI Encryption', () => {
    it('should encrypt patient demographics data', async () => {
      const createPatientDto = {
        clinic_id: testData.tenant.id,
        patient_external_id: 'EXT-001',
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
          ssn: '123-45-6789',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set(getTestHeaders(authToken))
        .send(createPatientDto)
        .expect(201);

      // Verify that the response doesn't contain raw PHI
      expect(response.body).not.toHaveProperty('demographics');
      expect(response.body).toHaveProperty('encrypted_demographics');
      expect(response.body).toHaveProperty('demographics_key_id');
    });

    it('should decrypt patient demographics when retrieving', async () => {
      const createPatientDto = {
        clinic_id: testData.tenant.id,
        patient_external_id: 'EXT-001',
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
        },
      };

      const createResponse = await request(app.getHttpServer())
        .post('/patients')
        .set(getTestHeaders(authToken))
        .send(createPatientDto);

      const patientId = createResponse.body.id;

      const getResponse = await request(app.getHttpServer())
        .get(`/patients/${patientId}`)
        .set(getTestHeaders(authToken))
        .expect(200);

      // Verify that the response contains decrypted demographics
      expect(getResponse.body).toHaveProperty('demographics');
      expect(getResponse.body.demographics).toHaveProperty('first_name', 'John');
      expect(getResponse.body.demographics).toHaveProperty('last_name', 'Doe');
      expect(getResponse.body.demographics).toHaveProperty('date_of_birth', '1990-01-01');
    });
  });
});
