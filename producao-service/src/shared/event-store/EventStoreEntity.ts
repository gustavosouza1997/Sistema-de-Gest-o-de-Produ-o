import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('events')
@Index(['streamId', 'version'], { unique: true })
export class EventStoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stream_id' })
  @Index()
  streamId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column()
  version: number;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
