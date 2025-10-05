import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

export interface CreateTenantDto {
  name: string;
  subdomain: string;
  config?: Record<string, any>;
}

export interface UpdateTenantDto {
  name?: string;
  config?: Record<string, any>;
  status?: string;
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Check if subdomain already exists
    const existingTenant = await this.tenantsRepository.findOne({
      where: { subdomain: createTenantDto.subdomain },
    });

    if (existingTenant) {
      throw new BadRequestException('Tenant with this subdomain already exists');
    }

    const tenant = this.tenantsRepository.create(createTenantDto);
    return await this.tenantsRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return await this.tenantsRepository.find({
      relations: ['users'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { subdomain },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with subdomain ${subdomain} not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    Object.assign(tenant, updateTenantDto);
    return await this.tenantsRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantsRepository.softDelete(id);
  }

  async getTenantStats(id: string): Promise<any> {
    const tenant = await this.findOne(id);
    
    // In a real implementation, you would query related tables for statistics
    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      status: tenant.status,
      userCount: tenant.users?.length || 0,
      createdAt: tenant.created_at,
    };
  }
}
