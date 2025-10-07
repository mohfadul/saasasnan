import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { Bed } from './entities/bed.entity';
import { BedAllotment } from './entities/bed-allotment.entity';
import { BloodBank } from './entities/blood-bank.entity';
import { Donor } from './entities/donor.entity';
import { LabReport } from './entities/lab-report.entity';
import { LabTemplate } from './entities/lab-template.entity';

@Injectable()
export class HospitalService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepo: Repository<Department>,
    @InjectRepository(Bed)
    private bedsRepo: Repository<Bed>,
    @InjectRepository(BedAllotment)
    private bedAllotmentsRepo: Repository<BedAllotment>,
    @InjectRepository(BloodBank)
    private bloodBankRepo: Repository<BloodBank>,
    @InjectRepository(Donor)
    private donorsRepo: Repository<Donor>,
    @InjectRepository(LabReport)
    private labReportsRepo: Repository<LabReport>,
    @InjectRepository(LabTemplate)
    private labTemplatesRepo: Repository<LabTemplate>,
  ) {}

  // Dashboard Overview
  async getDashboardOverview(tenantId: string, clinicId?: string) {
    const where: any = { tenant_id: tenantId };
    if (clinicId) where.clinic_id = clinicId;

    const [
      totalDepartments,
      totalBeds,
      occupiedBeds,
      totalDonors,
      bloodUnits,
      pendingLabReports,
    ] = await Promise.all([
      this.departmentsRepo.count({ where: { tenant_id: tenantId } }),
      this.bedsRepo.count({ where }),
      this.bedsRepo.count({ where: { ...where, status: 'occupied' } }),
      this.donorsRepo.count({ where: { tenant_id: tenantId } }),
      this.bloodBankRepo.sum('quantity', { tenant_id: tenantId }),
      this.labReportsRepo.count({ where: { ...where, status: 'pending' } }),
    ]);

    return {
      departments: { total: totalDepartments },
      beds: {
        total: totalBeds,
        occupied: occupiedBeds,
        available: totalBeds - occupiedBeds,
        occupancyRate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0,
      },
      bloodBank: {
        totalDonors,
        totalUnits: bloodUnits || 0,
      },
      laboratory: {
        pendingReports: pendingLabReports,
      },
    };
  }

  // Department Methods
  async getDepartments(tenantId: string) {
    return await this.departmentsRepo.find({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
    });
  }

  async createDepartment(data: any, tenantId: string) {
    const department = this.departmentsRepo.create({
      ...data,
      tenant_id: tenantId,
    });
    return await this.departmentsRepo.save(department);
  }

  // Bed Management
  async getAvailableBeds(tenantId: string, clinicId?: string, departmentId?: string) {
    const where: any = { tenant_id: tenantId, status: 'available' };
    if (clinicId) where.clinic_id = clinicId;
    if (departmentId) where.department_id = departmentId;

    return await this.bedsRepo.find({ where, order: { bed_number: 'ASC' } });
  }

  // Blood Bank
  async getBloodBankInventory(tenantId: string, clinicId?: string) {
    const where: any = { tenant_id: tenantId };
    if (clinicId) where.clinic_id = clinicId;

    const inventory = await this.bloodBankRepo
      .createQueryBuilder('blood')
      .select('blood.blood_group', 'blood_group')
      .addSelect('SUM(blood.quantity)', 'total_units')
      .where('blood.tenant_id = :tenantId', { tenantId })
      .andWhere('blood.status = :status', { status: 'available' })
      .groupBy('blood.blood_group')
      .getRawMany();

    return inventory;
  }

  // Lab Methods
  async getPendingLabReports(tenantId: string, clinicId?: string) {
    const where: any = { tenant_id: tenantId, status: 'pending' };
    if (clinicId) where.clinic_id = clinicId;

    return await this.labReportsRepo.find({
      where,
      order: { test_date: 'ASC' },
    });
  }
}

