import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { EditarReferenciaCommand } from './EditarReferencia.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';

@CommandHandler(EditarReferenciaCommand)
export class EditarReferenciaHandler implements ICommandHandler<EditarReferenciaCommand, void> {
  constructor(@Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository) {}

  async execute(command: EditarReferenciaCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.modeloId);
    if (!modelo) throw new NotFoundException(`Modelo ${command.modeloId} não encontrado`);
    await this.modeloRepo.save(modelo.editarReferencia(command.referenciaId, command.nome));
  }
}
