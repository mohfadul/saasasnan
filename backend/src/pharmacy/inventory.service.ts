import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugInventory } from './entities/drug-inventory.entity';
import { Drug } from './entities/drug.entity';

export interface CreateInventoryDto {
  drugId: string;
  clinicId: string;
  quantity: number;
  batchId: string;
  expiryDate: string;
  manufactureDate?: string;
  batchCostPrice: number;
  batchSellingPrice: number;
  shelfLocation?: string;
  binNumber?: string;
  minimumStock?: number;
  reorderLevel?: number;
}

export interface UpdateInventoryDto {
  quantity?: number;
  shelfLocation?: string;
  binNumber?: string;
  minimumStock?: number;
  reorderLevel?: number;
  status?: string;
}

export interface AdjustStockDto {
  adjustment: number;
  reason: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(DrugInventory)
    private inventoryRepository: Repository<DrugInventory>,
    @InjectRepository(Drug)
    private drugsRepository: Repository<Drug>,
  ) {}

  async create(createDto: CreateInventoryDto, tenantId: string, userId: string): Promise<DrugInventory> {
    const drug = await this.drugsRepository.findOne({
      where: { id: createDto.drugId, tenant_id: tenantId },
    });

    if (!drug) {
      throw new NotFoundException('Drug not found');
    }

    const existing = await this.inventoryRepository.findOne({
      where: {
        tenant_id: tenantId,
        drug_id: createDto.drugId,
        batch_id: createDto.batchId,
      },
    });

    if (existing) {
      throw new BadRequestException('Batch ID already exists for this drug');
    }

    const inventory = this.inventoryRepository.create({
      tenant_id: tenantId,
      clinic_id: createDto.clinicId,
      drug_id: createDto.drugId,
      quantity: createDto.quantity,
      batch_id: createDto.batchId,
      expiry_date: new Date(createDto.expiryDate),
      manufacture_date: createDto.manufactureDate ? new Date(createDto.manufactureDate) : null,
      batch_cost_price: createDto.batchCostPrice,
      batch_selling_price: createDto.batchSellingPrice,
      shelf_location: createDto.shelfLocation,
      bin_number: createDto.binNumber,
      minimum_stock: createDto.minimumStock || 10,
      reorder_level: createDto.reorderLevel || 20,
      added_by: userId,
    });

    return await this.inventoryRepository.save(inventory);
  }

  async findAll(tenantId: string, clinicId?: string): Promise<DrugInventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.drug', 'drug')
      .where('inventory.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('inventory.clinic_id = :clinicId', { clinicId });
    }

    return await query
      .orderBy('inventory.expiry_date', 'ASC')
      .getMany();
  }

  async findOne(id: string, tenantId: string): Promise<DrugInventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['drug'],
    });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    return inventory;
  }

  async update(id: string, updateDto: UpdateInventoryDto, tenantId: string): Promise<DrugInventory> {
    const inventory = await this.findOne(id, tenantId);
    Object.assign(inventory, updateDto);
    return await this.inventoryRepository.save(inventory);
  }

  async adjustStock(id: string, adjustDto: AdjustStockDto, tenantId: string): Promise<DrugInventory> {
    const inventory = await this.findOne(id, tenantId);
    
    const newQuantity = inventory.quantity + adjustDto.adjustment;
    
    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient stock for this adjustment');
    }

    inventory.quantity = newQuantity;

    if (newQuantity === 0) {
      inventory.status = 'out_of_stock';
    } else if (newQuantity <= inventory.minimum_stock) {
      inventory.status = 'low_stock';
    } else {
      inventory.status = 'available';
    }

    return await this.inventoryRepository.save(inventory);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const inventory = await this.findOne(id, tenantId);
    await this.inventoryRepository.remove(inventory);
  }

  async findByBatch(batchId: string, tenantId: string): Promise<DrugInventory[]> {
    return await this.inventoryRepository.find({
      where: { batch_id: batchId, tenant_id: tenantId },
      relations: ['drug'],
    });
  }
}

