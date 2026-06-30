import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class OrdemAberta implements DomainEvent {
  readonly eventType = 'OrdemAberta';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string, readonly abertura: Date) {}
}
