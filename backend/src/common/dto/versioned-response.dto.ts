import { ApiProperty } from '@nestjs/swagger';

export class ApiMetaDto {
  @ApiProperty({ description: 'API version' })
  version: string;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Whether this endpoint is deprecated', required: false })
  deprecated?: boolean;

  @ApiProperty({ description: 'Deprecation information', required: false })
  deprecationInfo?: {
    deprecatedSince?: string;
    removalDate?: string;
    alternativeEndpoint?: string;
    migrationGuide?: string;
  };
}

export class VersionedResponseDto<T = any> {
  @ApiProperty({ description: 'Response data' })
  data: T;

  @ApiProperty({ description: 'Response metadata', type: ApiMetaDto })
  meta: ApiMetaDto;
}

export class PaginatedResponseDto<T = any> {
  @ApiProperty({ description: 'Response data' })
  data: T[];

  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  @ApiProperty({ description: 'Response metadata', type: ApiMetaDto })
  meta: ApiMetaDto;
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'Error code' })
  code: string;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Additional error details', required: false })
  details?: any;

  @ApiProperty({ description: 'Request timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Request path' })
  path: string;
}
