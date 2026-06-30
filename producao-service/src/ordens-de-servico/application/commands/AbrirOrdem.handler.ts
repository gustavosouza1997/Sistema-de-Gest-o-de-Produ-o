import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AbrirOrdemCommand } from './AbrirOrdem.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(AbrirOrdemCommand)
export class AbrirOrdemHandler implements ICommandHandler<AbrirOrdemCommand, void> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: AbrirOrdemCommand): Promise<void> {
    const ordem = await this.repo.findById(command.id);
    if (!ordem) throw new NotFoundException(`Ordem ${command.id} não encontrada`);
    await this.repo.save(ordem.abrir());
  }
}
