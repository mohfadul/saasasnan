import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { TenantsService } from '../tenants/tenants.service';
import { CacheService } from '../common/services/cache.service';

export interface LoginDto {
  email: string;
  password: string;
  tenantId?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  clinicId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private tenantsService: TenantsService,
    private cacheService: CacheService,
  ) {}

  async validateUser(email: string, password: string, tenantId?: string): Promise<User | null> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .where('user.email = :email', { email });

    if (tenantId) {
      query.andWhere('user.tenant_id = :tenantId', { tenantId });
    }

    const user = await query.getOne();

    if (!user || !user.encrypted_password) {
      return null;
    }

    // Check if account is locked
    if (user.account_locked_until && user.account_locked_until > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failed_login_attempts += 1;
      if (user.failed_login_attempts >= 5) {
        user.account_locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      await this.usersRepository.save(user);
      return null;
    }

    // Reset failed login attempts on successful login
    if (user.failed_login_attempts > 0) {
      user.failed_login_attempts = 0;
      user.account_locked_until = null;
      user.last_login_at = new Date();
      await this.usersRepository.save(user);
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password, loginDto.tenantId);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      clinicId: user.clinic_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
        clinicId: user.clinic_id,
      },
    };
  }

  async createUser(createUserDto: {
    email: string;
    password: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    tenantId: string;
    clinicId?: string;
  }): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email, tenant_id: createUserDto.tenantId },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists in this tenant');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      encrypted_password: hashedPassword,
      role: createUserDto.role,
      first_name: createUserDto.firstName,
      last_name: createUserDto.lastName,
      tenant_id: createUserDto.tenantId,
      clinic_id: createUserDto.clinicId,
    });

    return await this.usersRepository.save(user);
  }

  async findUserById(id: string, tenantId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['tenant'],
    });
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      // Check if refresh token is blacklisted
      const isBlacklisted = await this.cacheService.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Get user from database
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
        relations: ['tenant'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        clinicId: user.clinic_id,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      });

      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, type: 'refresh' },
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        }
      );

      // Blacklist the old refresh token
      const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
      await this.cacheService.set(`blacklist:${refreshToken}`, true, refreshTokenExpiry);

      // Store new refresh token
      await this.cacheService.set(`refresh:${user.id}`, newRefreshToken, 7 * 24 * 60 * 60);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      // Blacklist the refresh token
      const tokenExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
      await this.cacheService.set(`blacklist:${refreshToken}`, true, tokenExpiry);

      // Remove from active refresh tokens
      await this.cacheService.del(`refresh:${payload.sub}`);
    } catch (error) {
      // Ignore errors during logout
    }
  }

  async revokeAllTokens(userId: string): Promise<void> {
    // Remove all refresh tokens for the user
    await this.cacheService.del(`refresh:${userId}`);
  }
}
