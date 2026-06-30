import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AdicionarRemessaCommand } from './AdicionarRemessa.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(AdicionarRemessaCommand)
export class AdicionarRemessaHandler implements ICommandHandler<AdicionarRemessaCommand, void> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: AdicionarRemessaCommand): Promise<void> {
    const ordem = await this.repo.findById(command.ordemId);
    if (!ordem) throw new NotFoundException(`Ordem ${command.ordemId} não encontrada`);
    await this.repo.save(ordem.adicionarRemessa(command.nome));
  }
}
