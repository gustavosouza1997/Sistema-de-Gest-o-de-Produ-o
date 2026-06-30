import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class LoteEditado implements DomainEvent {
  readonly eventType = 'LoteEditado';
  readonly occurredAt = new Date();
  constructor(
    readonly aggregateId: string,
    readonly remessaId: string,
    readonly loteId: string,
    readonly identificador: string,
    readonly codigoBarras: string | undefined,
    readonly modeloId: string,
    readonly quantidade: number,
  ) {}
}
