import { DomainEvent } from './DomainEvent';

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];
  protected addEvent(event: DomainEvent): void { this._domainEvents.push(event); }
  pullEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
