import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from '../marketplace/entities/product.entity';

export enum InventoryStatus {
  ACTIVE = 'active',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRED = 'expired',
}

@Entity('inventory')
export class Inventory extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  // Stock levels
  @Column({ default: 0 })
  current_stock: number;

  @Column({ default: 0 })
  minimum_stock: number;

  @Column({ default: 1000 })
  maximum_stock: number;

  @Column({ default: 0 })
  reserved_stock: number; // Stock reserved for pending orders

  // Location and tracking
  @Column({ length: 255, nullable: true })
  location?: string; // Shelf, room, etc.

  @Column({ length: 100, nullable: true })
  batch_number?: string;

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date;

  // Cost tracking
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  average_cost?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  last_cost?: number;

  // Status
  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.ACTIVE,
  })
  status: InventoryStatus;

  @ManyToOne(() => Product, product => product.inventories)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => InventoryTransaction, transaction => transaction.inventory)
  transactions: InventoryTransaction[];
}
