import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyService } from './pharmacy.service';
import { InventoryService } from './inventory.service';
import { SalesService } from './sales.service';
import { PrescriptionService } from './prescription.service';
import { SuppliersService } from './suppliers.service';
import { Drug } from './entities/drug.entity';
import { DrugCategory } from './entities/drug-category.entity';
import { DrugInventory } from './entities/drug-inventory.entity';
import { PharmacySale } from './entities/pharmacy-sale.entity';
import { PharmacySaleItem } from './entities/pharmacy-sale-item.entity';
import { PharmacySupplier } from './entities/pharmacy-supplier.entity';
import { DoctorPrescription } from './entities/doctor-prescription.entity';
import { PrescriptionItem } from './entities/prescription-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Drug,
      DrugCategory,
      DrugInventory,
      PharmacySale,
      PharmacySaleItem,
      PharmacySupplier,
      DoctorPrescription,
      PrescriptionItem,
    ]),
  ],
  controllers: [PharmacyController],
  providers: [
    PharmacyService,
    InventoryService,
    SalesService,
    PrescriptionService,
    SuppliersService,
  ],
  exports: [
    PharmacyService,
    InventoryService,
    SalesService,
    PrescriptionService,
    SuppliersService,
  ],
})
export class PharmacyModule {}

