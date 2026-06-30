import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AdicionarOperacaoAoRoteiroCommand } from './AdicionarOperacaoAoRoteiro.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';

@CommandHandler(AdicionarOperacaoAoRoteiroCommand)
export class AdicionarOperacaoAoRoteiroHandler implements ICommandHandler<AdicionarOperacaoAoRoteiroCommand, void> {
  constructor(
    @Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: AdicionarOperacaoAoRoteiroCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.modeloId);
    if (!modelo) throw new NotFoundException(`Modelo ${command.modeloId} não encontrado`);

    const updated = modelo.adicionarOperacaoAoRoteiro(command.descricao, command.tempo);
    await this.modeloRepo.save(updated);
    await this.eventStore.append(`modelo-${updated.id}`, updated.pullEvents());
  }
}
