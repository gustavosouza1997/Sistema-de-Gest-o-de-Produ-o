import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AtualizarModeloCommand } from './AtualizarModelo.command';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';

@CommandHandler(AtualizarModeloCommand)
export class AtualizarModeloHandler implements ICommandHandler<AtualizarModeloCommand, void> {
  constructor(@Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository) {}

  async execute(command: AtualizarModeloCommand): Promise<void> {
    const modelo = await this.modeloRepo.findById(command.id);
    if (!modelo) throw new NotFoundException(`Modelo ${command.id} não encontrado`);

    const updated = modelo.atualizar({
      sigla: command.sigla,
      linha: command.linha,
      preco: command.preco,
      producaoPorDia: command.producaoPorDia,
      turno: command.turno,
      custoPorMinutoPrevisto: command.custoPorMinutoPrevisto,
    });
    await this.modeloRepo.save(updated);
  }
}
