import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';

export interface CreateSupplierDto {
  name: string;
  contactInfo: Record<string, any>;
  businessInfo?: Record<string, any>;
  status?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto, tenantId: string): Promise<Supplier> {
    const supplier = this.suppliersRepository.create({
      tenant_id: tenantId,
      name: createSupplierDto.name,
      contact_info: createSupplierDto.contactInfo,
      business_info: createSupplierDto.businessInfo || {},
      status: createSupplierDto.status || 'active',
    });

    return await this.suppliersRepository.save(supplier);
  }

  async findAll(tenantId: string, status?: string): Promise<Supplier[]> {
    const query = this.suppliersRepository
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.products', 'products')
      .where('supplier.tenant_id = :tenantId', { tenantId });

    if (status) {
      query.andWhere('supplier.status = :status', { status });
    }

    return await query
      .orderBy('supplier.rating', 'DESC')
      .addOrderBy('supplier.total_orders', 'DESC')
      .getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['products', 'orders'],
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto, tenantId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);

    Object.assign(supplier, {
      name: updateSupplierDto.name || supplier.name,
      contact_info: updateSupplierDto.contactInfo || supplier.contact_info,
      business_info: updateSupplierDto.businessInfo || supplier.business_info,
      status: updateSupplierDto.status || supplier.status,
    });

    return await this.suppliersRepository.save(supplier);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const supplier = await this.findOne(id, tenantId);
    
    // Check if supplier has products
    if (supplier.products && supplier.products.length > 0) {
      throw new BadRequestException('Cannot delete supplier with existing products');
    }

    await this.suppliersRepository.softDelete(id);
  }

  async updateRating(id: string, tenantId: string, rating: number): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);
    
    if (rating < 0 || rating > 5) {
      throw new BadRequestException('Rating must be between 0 and 5');
    }

    supplier.rating = rating;
    return await this.suppliersRepository.save(supplier);
  }

  async updateDeliveryRate(id: string, tenantId: string, rate: number): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);
    
    if (rate < 0 || rate > 100) {
      throw new BadRequestException('Delivery rate must be between 0 and 100');
    }

    supplier.on_time_delivery_rate = rate;
    return await this.suppliersRepository.save(supplier);
  }

  async incrementOrderCount(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);
    supplier.total_orders += 1;
    return await this.suppliersRepository.save(supplier);
  }

  async getSupplierStats(tenantId: string): Promise<any> {
    const totalSuppliers = await this.suppliersRepository.count({
      where: { tenant_id: tenantId },
    });

    const activeSuppliers = await this.suppliersRepository.count({
      where: { tenant_id: tenantId, status: 'active' },
    });

    const avgRating = await this.suppliersRepository
      .createQueryBuilder('supplier')
      .select('AVG(supplier.rating)', 'avgRating')
      .where('supplier.tenant_id = :tenantId', { tenantId })
      .getRawOne();

    const topSuppliers = await this.suppliersRepository.find({
      where: { tenant_id: tenantId, status: 'active' },
      order: { rating: 'DESC', total_orders: 'DESC' },
      take: 5,
    });

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers: totalSuppliers - activeSuppliers,
      averageRating: parseFloat(avgRating.avgRating || '0'),
      topSuppliers: topSuppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        rating: supplier.rating,
        totalOrders: supplier.total_orders,
      })),
    };
  }
}
