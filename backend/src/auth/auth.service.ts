import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { TenantsService } from '../tenants/tenants.service';

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
}
