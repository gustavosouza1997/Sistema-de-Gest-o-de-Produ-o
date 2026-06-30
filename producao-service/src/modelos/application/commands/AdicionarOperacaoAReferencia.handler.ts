import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AdicionarOperacaoAReferenciaCommand } from './AdicionarOperacaoAReferencia.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';

@CommandHandler(AdicionarOperacaoAReferenciaCommand)
export class AdicionarOperacaoAReferenciaHandler implements ICommandHandler<AdicionarOperacaoAReferenciaCommand, void> {
  constructor(
    @Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: AdicionarOperacaoAReferenciaCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.modeloId);
    if (!modelo) throw new NotFoundException(`Modelo ${command.modeloId} não encontrado`);

    const updated = modelo.adicionarOperacaoAReferencia(command.referenciaId, command.descricao, command.tempo);
    await this.modeloRepo.save(updated);
    await this.eventStore.append(`modelo-${updated.id}`, updated.pullEvents());
  }
}
