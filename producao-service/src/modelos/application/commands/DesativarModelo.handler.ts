import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DesativarModeloCommand } from './DesativarModelo.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';

@CommandHandler(DesativarModeloCommand)
export class DesativarModeloHandler implements ICommandHandler<DesativarModeloCommand, void> {
  constructor(
    @Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: DesativarModeloCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.id);
    if (!modelo) throw new NotFoundException(`Modelo ${command.id} não encontrado`);

    const updated = modelo.desativar();
    await this.modeloRepo.save(updated);
    await this.eventStore.append(`modelo-${updated.id}`, updated.pullEvents());
  }
}
