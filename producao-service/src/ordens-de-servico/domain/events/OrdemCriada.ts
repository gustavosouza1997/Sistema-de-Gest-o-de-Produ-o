import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class OrdemCriada implements DomainEvent {
  readonly eventType = 'OrdemCriada';
  readonly occurredAt = new Date();
  constructor(
    readonly aggregateId: string,
    readonly empresaId: string,
    readonly notaFiscalOrigem: string,
    readonly numero: string,
    readonly criadaEm: Date,
  ) {}
}
