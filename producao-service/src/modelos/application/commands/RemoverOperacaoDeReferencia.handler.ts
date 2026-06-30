import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RemoverOperacaoDeReferenciaCommand } from './RemoverOperacaoDeReferencia.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';

@CommandHandler(RemoverOperacaoDeReferenciaCommand)
export class RemoverOperacaoDeReferenciaHandler implements ICommandHandler<RemoverOperacaoDeReferenciaCommand, void> {
  constructor(@Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository) {}

  async execute(command: RemoverOperacaoDeReferenciaCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.modeloId);
    if (!modelo) throw new NotFoundException(`Modelo ${command.modeloId} não encontrado`);
    await this.modeloRepo.save(modelo.removerOperacaoDeReferencia(command.referenciaId, command.operacaoId));
  }
}
