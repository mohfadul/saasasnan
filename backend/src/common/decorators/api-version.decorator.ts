import { SetMetadata } from '@nestjs/common';

export const API_VERSION_KEY = 'api_version';

export interface ApiVersionOptions {
  version: string;
  deprecated?: boolean;
  deprecatedSince?: string;
  removalDate?: string;
  alternativeEndpoint?: string;
  migrationGuide?: string;
}

export const ApiVersion = (options: ApiVersionOptions) => SetMetadata(API_VERSION_KEY, options);

export const V1 = () => ApiVersion({ version: 'v1' });
export const V2 = () => ApiVersion({ version: 'v2' });
export const V3 = () => ApiVersion({ version: 'v3' });

export const DeprecatedApi = (since: string, removalDate?: string, alternative?: string) =>
  ApiVersion({
    version: 'v1',
    deprecated: true,
    deprecatedSince: since,
    removalDate,
    alternativeEndpoint: alternative,
  });
