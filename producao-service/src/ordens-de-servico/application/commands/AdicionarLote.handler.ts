import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AdicionarLoteCommand } from './AdicionarLote.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(AdicionarLoteCommand)
export class AdicionarLoteHandler implements ICommandHandler<AdicionarLoteCommand, void> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: AdicionarLoteCommand): Promise<void> {
    const ordem = await this.repo.findById(command.ordemId);
    if (!ordem) throw new NotFoundException(`Ordem ${command.ordemId} não encontrada`);
    await this.repo.save(
      ordem.adicionarLote(command.remessaId, command.identificador, command.codigoBarras, command.modeloId, command.quantidade),
    );
  }
}
