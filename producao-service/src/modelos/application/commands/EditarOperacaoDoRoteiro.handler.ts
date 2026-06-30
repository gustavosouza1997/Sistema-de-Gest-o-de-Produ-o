import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { EditarOperacaoDoRoteiroCommand } from './EditarOperacaoDoRoteiro.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';

@CommandHandler(EditarOperacaoDoRoteiroCommand)
export class EditarOperacaoDoRoteiroHandler implements ICommandHandler<EditarOperacaoDoRoteiroCommand, void> {
  constructor(@Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository) {}

  async execute(command: EditarOperacaoDoRoteiroCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.modeloId);
    if (!modelo) throw new NotFoundException(`Modelo ${command.modeloId} não encontrado`);
    await this.modeloRepo.save(modelo.editarOperacaoDoRoteiro(command.operacaoId, command.descricao, command.tempo));
  }
}
