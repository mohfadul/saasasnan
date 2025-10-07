import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drug } from './entities/drug.entity';
import { DrugInventory } from './entities/drug-inventory.entity';
import { PharmacySale } from './entities/pharmacy-sale.entity';
import { DoctorPrescription } from './entities/doctor-prescription.entity';

@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(Drug)
    private drugsRepository: Repository<Drug>,
    @InjectRepository(DrugInventory)
    private inventoryRepository: Repository<DrugInventory>,
    @InjectRepository(PharmacySale)
    private salesRepository: Repository<PharmacySale>,
    @InjectRepository(DoctorPrescription)
    private prescriptionsRepository: Repository<DoctorPrescription>,
  ) {}

  // Dashboard Overview
  async getDashboardOverview(tenantId: string, clinicId?: string) {
    const where: any = { tenant_id: tenantId };
    if (clinicId) where.clinic_id = clinicId;

    // Get counts
    const totalDrugs = await this.drugsRepository.count({ where });
    const totalSales = await this.salesRepository.count({ where });
    const totalPrescriptions = await this.prescriptionsRepository.count({ where });
    
    // Get inventory stats
    const inventory = await this.inventoryRepository.find({ where });
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.minimum_stock).length;
    const expiringSoon = inventory.filter(item => {
      const daysToExpiry = Math.floor((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysToExpiry >= 0 && daysToExpiry <= 30;
    }).length;
    const expired = inventory.filter(item => new Date(item.expiry_date) < new Date()).length;

    // Get today's sales revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = await this.salesRepository
      .createQueryBuilder('sale')
      .where('sale.tenant_id = :tenantId', { tenantId })
      .andWhere('sale.sale_date >= :today', { today })
      .andWhere('sale.status = :status', { status: 'completed' })
      .getMany();
    const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);

    return {
      drugs: {
        total: totalDrugs,
        active: await this.drugsRepository.count({ where: { ...where, status: 'active' } }),
      },
      inventory: {
        totalStock,
        lowStockItems,
        expiringSoon,
        expired,
        outOfStock: inventory.filter(item => item.quantity === 0).length,
      },
      sales: {
        total: totalSales,
        todayRevenue,
        todayCount: todaySales.length,
      },
      prescriptions: {
        total: totalPrescriptions,
        pending: await this.prescriptionsRepository.count({ where: { ...where, status: 'pending' } }),
        verified: await this.prescriptionsRepository.count({ where: { ...where, status: 'verified' } }),
      },
    };
  }

  // Get expiring drugs
  async getExpiringDrugs(tenantId: string, clinicId?: string, days: number = 30) {
    const where: any = { tenant_id: tenantId };
    if (clinicId) where.clinic_id = clinicId;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.drug', 'drug')
      .where('inventory.tenant_id = :tenantId', { tenantId })
      .andWhere('inventory.expiry_date <= :futureDate', { futureDate })
      .andWhere('inventory.expiry_date >= :today', { today: new Date() })
      .orderBy('inventory.expiry_date', 'ASC')
      .getMany();
  }

  // Get low stock drugs
  async getLowStockDrugs(tenantId: string, clinicId?: string) {
    const where: any = { tenant_id: tenantId };
    if (clinicId) where.clinic_id = clinicId;

    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.drug', 'drug')
      .where('inventory.tenant_id = :tenantId', { tenantId })
      .andWhere('inventory.quantity <= inventory.minimum_stock')
      .andWhere('inventory.quantity > 0')
      .orderBy('inventory.quantity', 'ASC')
      .getMany();
  }

  // Get out of stock drugs
  async getOutOfStockDrugs(tenantId: string, clinicId?: string) {
    const where: any = { tenant_id: tenantId };
    if (clinicId) where.clinic_id = clinicId;

    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.drug', 'drug')
      .where('inventory.tenant_id = :tenantId', { tenantId })
      .andWhere('inventory.quantity = 0')
      .getMany();
  }
}

