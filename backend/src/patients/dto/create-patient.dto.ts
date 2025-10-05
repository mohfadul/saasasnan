import { IsString, IsEmail, IsDateString, IsOptional, IsObject, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientDemographicsDto {
  @ApiProperty({ description: 'Patient first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Patient last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Patient date of birth' })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ description: 'Patient gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Patient phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Patient email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Patient address' })
  @IsOptional()
  @IsObject()
  address?: Record<string, any>;
}

export class CreatePatientDto {
  @ApiProperty({ description: 'Patient demographics' })
  @IsObject()
  demographics: PatientDemographicsDto;

  @ApiProperty({ description: 'Clinic ID' })
  @IsUUID()
  clinicId: string;

  @ApiPropertyOptional({ description: 'Patient external ID' })
  @IsOptional()
  @IsString()
  patientExternalId?: string;

  @ApiPropertyOptional({ description: 'Patient tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Consent flags' })
  @IsOptional()
  @IsObject()
  consentFlags?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Medical alert flags' })
  @IsOptional()
  @IsObject()
  medicalAlertFlags?: Record<string, any>;
}
