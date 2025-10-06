import { IsString, IsEmail, IsDateString, IsOptional, IsObject, IsArray, IsUUID, Length, Matches, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class PatientDemographicsDto {
  @ApiProperty({ description: 'Patient first name' })
  @IsString()
  @Length(1, 50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'First name must contain only letters, spaces, hyphens, and apostrophes'
  })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ description: 'Patient last name' })
  @IsString()
  @Length(1, 50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Last name must contain only letters, spaces, hyphens, and apostrophes'
  })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({ description: 'Patient date of birth' })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ description: 'Patient gender' })
  @IsOptional()
  @IsString()
  @Matches(/^(male|female|other|prefer_not_to_say)$/, {
    message: 'Gender must be one of: male, female, other, prefer_not_to_say'
  })
  gender?: string;

  @ApiPropertyOptional({ description: 'Patient phone number' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid international format'
  })
  phone?: string;

  @ApiPropertyOptional({ description: 'Patient email address' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email?: string;

  @ApiPropertyOptional({ description: 'Patient address' })
  @IsOptional()
  @IsObject()
  address?: Record<string, any>;
}

export class CreatePatientDto {
  @ApiProperty({ description: 'Patient demographics' })
  @ValidateNested()
  @Type(() => PatientDemographicsDto)
  demographics: PatientDemographicsDto;

  @ApiProperty({ description: 'Clinic ID' })
  @IsUUID()
  clinicId: string;

  @ApiPropertyOptional({ description: 'Patient external ID' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value?.trim())
  patientExternalId?: string;

  @ApiPropertyOptional({ description: 'Patient tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Length(1, 20, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Consent flags' })
  @IsOptional()
  @IsObject()
  consentFlags?: Record<string, boolean>;

  @ApiPropertyOptional({ description: 'Medical alert flags' })
  @IsOptional()
  @IsObject()
  medicalAlertFlags?: Record<string, boolean>;
}
