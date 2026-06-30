import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { EtapaFabricacao } from '../Lote';

export class EtapaLoteAvancada implements DomainEvent {
  readonly eventType = 'EtapaLoteAvancada';
  readonly occurredAt = new Date();
  constructor(
    readonly aggregateId: string,
    readonly remessaId: string,
    readonly loteId: string,
    readonly etapaAnterior: EtapaFabricacao,
    readonly etapaAtual: EtapaFabricacao,
  ) {}
}
