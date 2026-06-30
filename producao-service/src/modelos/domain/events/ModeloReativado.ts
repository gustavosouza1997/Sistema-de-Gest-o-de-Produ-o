import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class ModeloReativado implements DomainEvent {
  readonly eventType = 'ModeloReativado';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string) {}
}
