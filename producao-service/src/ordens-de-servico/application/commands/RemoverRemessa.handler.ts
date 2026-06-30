import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RemoverRemessaCommand } from './RemoverRemessa.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(RemoverRemessaCommand)
export class RemoverRemessaHandler implements ICommandHandler<RemoverRemessaCommand, void> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: RemoverRemessaCommand): Promise<void> {
    const ordem = await this.repo.findById(command.ordemId);
    if (!ordem) throw new NotFoundException(`Ordem ${command.ordemId} não encontrada`);
    await this.repo.save(ordem.removerRemessa(command.remessaId));
  }
}
