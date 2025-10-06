import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class TokenResponseDto {
  @ApiProperty({ description: 'Access token' })
  access_token: string;

  @ApiProperty({ description: 'Refresh token' })
  refresh_token: string;

  @ApiProperty({ description: 'Token type' })
  token_type: string = 'Bearer';

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expires_in: number;
}

