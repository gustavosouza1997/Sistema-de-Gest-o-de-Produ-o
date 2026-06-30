import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ConcluirOrdemCommand } from './ConcluirOrdem.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(ConcluirOrdemCommand)
export class ConcluirOrdemHandler implements ICommandHandler<ConcluirOrdemCommand, void> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: ConcluirOrdemCommand): Promise<void> {
    const ordem = await this.repo.findById(command.id);
    if (!ordem) throw new NotFoundException(`Ordem ${command.id} não encontrada`);
    await this.repo.save(ordem.concluir());
  }
}
