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
  MOBILE_WALLET = 'mobile_wallet',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// Sudan-specific payment providers
export enum PaymentProvider {
  BANK_OF_KHARTOUM = 'BankOfKhartoum',
  FAISAL_ISLAMIC_BANK = 'FaisalIslamicBank',
  OMDURMAN_NATIONAL_BANK = 'OmdurmanNationalBank',
  ZAIN_BEDE = 'ZainBede',
  CASHI = 'Cashi',
  CASH_ON_DELIVERY = 'CashOnDelivery',
  CASH_AT_BRANCH = 'CashAtBranch',
  OTHER = 'Other',
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

  @Column('json', { nullable: true })
  gateway_response?: Record<string, any>; // Full response from payment gateway

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  processing_fee: number;

  // Status
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus;

  // Sudan Payment System Fields
  @Column({
    type: 'enum',
    enum: PaymentProvider,
    nullable: true,
  })
  provider?: PaymentProvider;

  @Column({ length: 100, nullable: true })
  reference_id?: string; // Bank transfer ref, wallet transaction ID, or agent code

  @Column({ length: 255, nullable: true })
  payer_name?: string;

  @Column({ length: 20, nullable: true })
  wallet_phone?: string; // Sudan mobile wallet phone number

  @Column({ length: 500, nullable: true })
  receipt_url?: string; // URL to uploaded receipt/screenshot

  // Manual Review Fields
  @Column({ type: 'uuid', nullable: true })
  reviewed_by?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at?: Date;

  @Column({ type: 'text', nullable: true })
  admin_notes?: string; // Notes added by admin during review

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by' })
  reviewed_by_user?: User;
}
