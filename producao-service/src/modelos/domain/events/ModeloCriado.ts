import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class ModeloCriado implements DomainEvent {
  readonly eventType = 'ModeloCriado';
  readonly occurredAt = new Date();
  constructor(
    readonly aggregateId: string,
    readonly empresaId: string,
    readonly sigla: string,
    readonly linha: string,
  ) {}
}
