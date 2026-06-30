import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class EmpresaReativada implements DomainEvent {
  readonly eventType = 'EmpresaReativada';
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string) {}
}
