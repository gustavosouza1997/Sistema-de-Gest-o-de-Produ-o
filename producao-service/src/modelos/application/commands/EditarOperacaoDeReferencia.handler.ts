import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { EditarOperacaoDeReferenciaCommand } from './EditarOperacaoDeReferencia.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';

@CommandHandler(EditarOperacaoDeReferenciaCommand)
export class EditarOperacaoDeReferenciaHandler implements ICommandHandler<EditarOperacaoDeReferenciaCommand, void> {
  constructor(@Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository) {}

  async execute(command: EditarOperacaoDeReferenciaCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.modeloId);
    if (!modelo) throw new NotFoundException(`Modelo ${command.modeloId} não encontrado`);
    await this.modeloRepo.save(
      modelo.editarOperacaoDeReferencia(command.referenciaId, command.operacaoId, command.descricao, command.tempo),
    );
  }
}
