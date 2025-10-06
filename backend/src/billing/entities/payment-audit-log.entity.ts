import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { User } from '../../auth/entities/user.entity';

export enum PaymentAuditAction {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
}

@Entity('payment_audit_log')
export class PaymentAuditLog {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  payment_id: string;

  @Column({
    type: 'enum',
    enum: PaymentAuditAction,
  })
  action: PaymentAuditAction;

  @Column({ type: 'uuid' })
  performed_by: string;

  @Column({ length: 50, nullable: true })
  previous_status?: string;

  @Column({ length: 50, nullable: true })
  new_status?: string;

  @Column({ length: 45, nullable: true })
  ip_address?: string;

  @Column({ type: 'text', nullable: true })
  user_agent?: string;

  @Column({ type: 'json', nullable: true })
  changes?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performed_by' })
  performed_by_user?: User;
}

