import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Payment } from './payment.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum CustomerType {
  PATIENT = 'patient',
  INSURANCE = 'insurance',
  THIRD_PARTY = 'third_party',
}

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36 })
  clinic_id: string;

  // Invoice details
  @Column({ length: 100 })
  invoice_number: string;

  @Column({ type: 'date' })
  invoice_date: Date;

  @Column({ type: 'date' })
  due_date: Date;

  // Customer information
  @Column({
    type: 'enum',
    enum: CustomerType,
  })
  customer_type: CustomerType;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customer_id?: string; // References patients(id) or insurance_providers(id)

  @Column({ type: 'json' })
  customer_info: Record<string, any>; // Name, address, contact info

  // Financial
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance_amount: number;

  // Status and payment
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ default: 30 })
  payment_terms: number; // Days

  @Column({ length: 50, nullable: true })
  payment_method?: string;

  @Column({ length: 255, nullable: true })
  payment_reference?: string;

  @Column({ type: 'date', nullable: true })
  paid_date?: Date;

  // Additional
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  terms_and_conditions?: string;

  // Audit
  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user?: User;

  @OneToMany(() => InvoiceItem, item => item.invoice)
  items: InvoiceItem[];

  @OneToMany(() => Payment, payment => payment.invoice)
  payments: Payment[];
}
