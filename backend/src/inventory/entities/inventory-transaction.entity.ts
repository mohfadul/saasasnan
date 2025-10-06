import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Inventory } from './inventory.entity';
import { Product } from '../../marketplace/entities/product.entity';
import { User } from '../../auth/entities/user.entity';

export enum TransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  RETURN = 'return',
  WASTE = 'waste',
}

@Entity('inventory_transactions')
export class InventoryTransaction extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36 })
  clinic_id: string;

  @Column({ type: 'varchar', length: 36 })
  product_id: string;

  @Column({ type: 'varchar', length: 36 })
  inventory_id: string;

  // Transaction details
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transaction_type: TransactionType;

  @Column({ type: 'integer' })
  quantity: number; // Positive for stock in, negative for stock out

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unit_cost?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_cost?: number;

  // Reference information
  @Column({ length: 50, nullable: true })
  reference_type?: string; // 'order', 'appointment', 'manual', etc.

  @Column({ type: 'varchar', length: 36, nullable: true })
  reference_id?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Audit
  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by?: string;

  @ManyToOne(() => Inventory, inventory => inventory.transactions)
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user?: User;
}
