import { DomainEvent } from '../../../shared/domain/DomainEvent';
export class OrdemCancelada implements DomainEvent {
  readonly eventType = 'OrdemCancelada';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string) {}
}
