import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class EmpresaCriada implements DomainEvent {
  readonly eventType = 'EmpresaCriada';
  readonly occurredAt = new Date();
  constructor(
    readonly aggregateId: string,
    readonly razaoSocial: string,
    readonly cnpj: string,
  ) {}
}
