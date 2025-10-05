import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedData {
  encryptedData: Buffer;
  encryptionContext: Record<string, string>;
  keyId: string;
  algorithm: string;
}

@Injectable()
export class PHIEncryptionService {
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default-key-change-in-production';
  }

  async encryptPHI(data: any, context: Record<string, string> = {}): Promise<EncryptedData> {
    const plaintext = JSON.stringify(data);
    
    // In production, use AWS KMS or similar
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from(JSON.stringify(context)));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]),
      encryptionContext: context,
      keyId: 'local-key',
      algorithm,
    };
  }

  async decryptPHI(encryptedData: EncryptedData): Promise<any> {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const iv = encryptedData.encryptedData.subarray(0, 16);
    const authTag = encryptedData.encryptedData.subarray(16, 32);
    const encrypted = encryptedData.encryptedData.subarray(32);
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from(JSON.stringify(encryptedData.encryptionContext)));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Helper method to encrypt patient demographics
  async encryptPatientDemographics(demographics: any, tenantId: string): Promise<EncryptedData> {
    return this.encryptPHI(demographics, {
      tenantId,
      service: 'healthcare-platform',
      timestamp: Date.now().toString(),
    });
  }

  // Helper method to decrypt patient demographics
  async decryptPatientDemographics(encryptedData: EncryptedData): Promise<any> {
    return this.decryptPHI(encryptedData);
  }
}
