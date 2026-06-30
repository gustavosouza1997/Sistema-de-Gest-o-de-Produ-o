import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class LoteRemovido implements DomainEvent {
  readonly eventType = 'LoteRemovido';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string, readonly remessaId: string, readonly loteId: string) {}
}
