import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class EtapaConcluida implements DomainEvent {
  readonly eventType = 'EtapaConcluida';
  readonly occurredAt = new Date();
  constructor(
    readonly aggregateId: string,
    readonly etapaId: string,
    readonly operadorId: string,
  ) {}
}
