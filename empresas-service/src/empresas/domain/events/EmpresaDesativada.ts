import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class EmpresaDesativada implements DomainEvent {
  readonly eventType = 'EmpresaDesativada';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string) {}
}
