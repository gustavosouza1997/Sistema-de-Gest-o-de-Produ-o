import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { IniciarExecucaoOrdemCommand } from './IniciarExecucaoOrdem.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(IniciarExecucaoOrdemCommand)
export class IniciarExecucaoOrdemHandler implements ICommandHandler<IniciarExecucaoOrdemCommand, void> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: IniciarExecucaoOrdemCommand): Promise<void> {
    const ordem = await this.repo.findById(command.id);
    if (!ordem) throw new NotFoundException(`Ordem ${command.id} não encontrada`);
    await this.repo.save(ordem.iniciarExecucao());
  }
}
