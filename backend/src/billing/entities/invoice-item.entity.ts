import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Invoice } from './invoice.entity';

export enum ItemType {
  SERVICE = 'service',
  PRODUCT = 'product',
  TREATMENT = 'treatment',
  PROCEDURE = 'procedure',
  CONSULTATION = 'consultation',
}

@Entity('invoice_items')
export class InvoiceItem extends BaseEntity {
  @Column({ type: 'uuid' })
  invoice_id: string;

  // Item details
  @Column({ type: 'text' })
  description: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_price: number;

  // Reference to source
  @Column({
    type: 'enum',
    enum: ItemType,
    nullable: true,
  })
  item_type?: ItemType;

  @Column({ type: 'uuid', nullable: true })
  reference_id?: string; // References appointments(id), products(id), etc.

  // Tax information
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tax_rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax_amount: number;

  @ManyToOne(() => Invoice, invoice => invoice.items)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
