import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Invoice } from './invoice.entity';
import { User } from '../../auth/entities/user.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  INSURANCE = 'insurance',
  ONLINE = 'online',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  invoice_id?: string;

  // Payment details
  @Column({ length: 100 })
  payment_number: string;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  payment_method: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // Payment processing
  @Column({ length: 255, nullable: true })
  transaction_id?: string; // External payment processor ID

  @Column('jsonb', { nullable: true })
  gateway_response?: Record<string, any>; // Full response from payment gateway

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  processing_fee: number;

  // Status
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.COMPLETED,
  })
  status: PaymentStatus;

  // Additional
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Audit
  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @ManyToOne(() => Invoice, invoice => invoice.payments)
  @JoinColumn({ name: 'invoice_id' })
  invoice?: Invoice;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user?: User;
}
