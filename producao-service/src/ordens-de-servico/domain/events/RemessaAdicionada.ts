import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class RemessaAdicionada implements DomainEvent {
  readonly eventType = 'RemessaAdicionada';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string, readonly remessaId: string, readonly nome: string) {}
}
