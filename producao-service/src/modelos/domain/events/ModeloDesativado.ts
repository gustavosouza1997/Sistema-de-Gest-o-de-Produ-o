import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class ModeloDesativado implements DomainEvent {
  readonly eventType = 'ModeloDesativado';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string) {}
}
