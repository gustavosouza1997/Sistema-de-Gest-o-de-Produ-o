import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AdicionarReferenciaCommand } from './AdicionarReferencia.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';

@CommandHandler(AdicionarReferenciaCommand)
export class AdicionarReferenciaHandler implements ICommandHandler<AdicionarReferenciaCommand, void> {
  constructor(
    @Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: AdicionarReferenciaCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.modeloId);
    if (!modelo) throw new NotFoundException(`Modelo ${command.modeloId} não encontrado`);

    const updated = modelo.adicionarReferencia(command.nome);
    await this.modeloRepo.save(updated);
    await this.eventStore.append(`modelo-${updated.id}`, updated.pullEvents());
  }
}
