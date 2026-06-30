import { DomainEvent } from '../../../shared/domain/DomainEvent';
export class OrdemEmExecucao implements DomainEvent {
  readonly eventType = 'OrdemEmExecucao';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string) {}
}
