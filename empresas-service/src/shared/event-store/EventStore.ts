import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainEvent } from '../domain/DomainEvent';
import { EventStoreEntity } from './EventStoreEntity';

@Injectable()
export class EventStore {
  constructor(@InjectRepository(EventStoreEntity) private readonly repo: Repository<EventStoreEntity>) {}

  async append(streamId: string, events: DomainEvent[]): Promise<void> {
    const last = await this.repo.findOne({ where: { streamId }, order: { version: 'DESC' } });
    const lastVersion = last?.version ?? 0;
    const entities = events.map((event, i) =>
      this.repo.create({ streamId, eventType: event.eventType, payload: event as any, version: lastVersion + i + 1 }),
    );
    await this.repo.save(entities);
  }
}
