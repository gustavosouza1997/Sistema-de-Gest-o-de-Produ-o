import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class EmpresaAtualizada implements DomainEvent {
  readonly eventType = 'EmpresaAtualizada';
  readonly occurredAt = new Date();
  constructor(
    readonly aggregateId: string,
    readonly campos: { nome?: string; cnpj?: string; telefone?: string; email?: string },
  ) {}
}
