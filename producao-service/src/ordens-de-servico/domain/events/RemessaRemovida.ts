import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class RemessaRemovida implements DomainEvent {
  readonly eventType = 'RemessaRemovida';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string, readonly remessaId: string) {}
}
