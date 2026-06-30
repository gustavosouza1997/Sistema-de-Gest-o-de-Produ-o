import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RemoverReferenciaCommand } from './RemoverReferencia.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';

@CommandHandler(RemoverReferenciaCommand)
export class RemoverReferenciaHandler implements ICommandHandler<RemoverReferenciaCommand, void> {
  constructor(@Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository) {}

  async execute(command: RemoverReferenciaCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.modeloId);
    if (!modelo) throw new NotFoundException(`Modelo ${command.modeloId} não encontrado`);
    await this.modeloRepo.save(modelo.removerReferencia(command.referenciaId));
  }
}
