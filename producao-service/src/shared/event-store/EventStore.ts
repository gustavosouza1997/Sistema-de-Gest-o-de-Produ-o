import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainEvent } from '../domain/DomainEvent';
import { EventStoreEntity } from './EventStoreEntity';
import { domainEventsTotal } from '../metrics/metrics';

@Injectable()
export class EventStore {
  constructor(
    @InjectRepository(EventStoreEntity)
    private readonly repo: Repository<EventStoreEntity>,
  ) {}

  async append(streamId: string, events: DomainEvent[]): Promise<void> {
    const lastVersion = await this.getLastVersion(streamId);

    const entities = events.map((event, index) =>
      this.repo.create({
        streamId,
        eventType: event.eventType,
        payload: event as unknown as Record<string, unknown>,
        version: lastVersion + index + 1,
        occurredAt: event.occurredAt,
      }),
    );

    await this.repo.save(entities);
    for (const event of events) {
      domainEventsTotal.inc({ event_type: event.eventType });
    }
  }

  async getStream(streamId: string): Promise<EventStoreEntity[]> {
    return this.repo.find({
      where: { streamId },
      order: { version: 'ASC' },
    });
  }

  private async getLastVersion(streamId: string): Promise<number> {
    const last = await this.repo.findOne({
      where: { streamId },
      order: { version: 'DESC' },
    });
    return last?.version ?? 0;
  }
}
