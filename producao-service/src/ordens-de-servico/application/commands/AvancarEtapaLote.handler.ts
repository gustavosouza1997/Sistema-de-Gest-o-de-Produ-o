import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AvancarEtapaLoteCommand } from './AvancarEtapaLote.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(AvancarEtapaLoteCommand)
export class AvancarEtapaLoteHandler implements ICommandHandler<AvancarEtapaLoteCommand, void> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: AvancarEtapaLoteCommand): Promise<void> {
    const ordem = await this.repo.findById(command.ordemId);
    if (!ordem) throw new NotFoundException(`Ordem ${command.ordemId} não encontrada`);
    await this.repo.save(ordem.avancarEtapaLote(command.remessaId, command.loteId));
  }
}
