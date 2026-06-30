import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CriarOrdemCommand } from './CriarOrdem.command';
import { OrdemDeServico } from '../../domain/OrdemDeServico';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(CriarOrdemCommand)
export class CriarOrdemHandler implements ICommandHandler<CriarOrdemCommand, string> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly ordemRepo: OrdemRepository) {}

  async execute(command: CriarOrdemCommand): Promise<string> {
    const ano = new Date().getFullYear();
    const numero = await this.ordemRepo.nextNumero(ano);
    const ordem = OrdemDeServico.criar(command, numero);
    await this.ordemRepo.save(ordem);
    return ordem.id;
  }
}
