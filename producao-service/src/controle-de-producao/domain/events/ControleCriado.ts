import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class ControleCriado implements DomainEvent {
  readonly eventType = 'ControleCriado';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string, readonly ordemId: string) {}
}
