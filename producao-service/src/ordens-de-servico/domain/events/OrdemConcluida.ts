import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class OrdemConcluida implements DomainEvent {
  readonly eventType = 'OrdemConcluida';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string, readonly conclusao: Date) {}
}
