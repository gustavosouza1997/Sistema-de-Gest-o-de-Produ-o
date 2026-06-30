import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { CancelarOrdemCommand } from './CancelarOrdem.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(CancelarOrdemCommand)
export class CancelarOrdemHandler implements ICommandHandler<CancelarOrdemCommand, void> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: CancelarOrdemCommand): Promise<void> {
    const ordem = await this.repo.findById(command.id);
    if (!ordem) throw new NotFoundException(`Ordem ${command.id} não encontrada`);
    await this.repo.save(ordem.cancelar());
  }
}
