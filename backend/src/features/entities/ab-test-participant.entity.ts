import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ABTest } from './ab-test.entity';
import { User } from '../../auth/entities/user.entity';

export enum ParticipantStatus {
  ACTIVE = 'active',
  CONVERTED = 'converted',
  DROPPED = 'dropped',
  EXCLUDED = 'excluded',
}

@Entity('ab_test_participants')
@Index(['ab_test_id', 'user_id'], { unique: true })
export class ABTestParticipant extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ab_test_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  variant: string;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.ACTIVE,
  })
  status: ParticipantStatus;

  @Column({ type: 'timestamp' })
  assigned_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  converted_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dropped_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  conversion_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  session_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  device_info?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  user_attributes?: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  session_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => ABTest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ab_test_id' })
  ab_test: ABTest;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
