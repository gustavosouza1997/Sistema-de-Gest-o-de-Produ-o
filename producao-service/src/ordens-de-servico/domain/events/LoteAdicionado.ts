import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class LoteAdicionado implements DomainEvent {
  readonly eventType = 'LoteAdicionado';
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
