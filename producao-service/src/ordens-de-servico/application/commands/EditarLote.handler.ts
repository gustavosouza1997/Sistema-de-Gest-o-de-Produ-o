import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { EditarLoteCommand } from './EditarLote.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

@CommandHandler(EditarLoteCommand)
export class EditarLoteHandler implements ICommandHandler<EditarLoteCommand, void> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: EditarLoteCommand): Promise<void> {
    const ordem = await this.repo.findById(command.ordemId);
    if (!ordem) throw new NotFoundException(`Ordem ${command.ordemId} não encontrada`);
    await this.repo.save(
      ordem.editarLote(command.remessaId, command.loteId, command.identificador, command.codigoBarras, command.modeloId, command.quantidade),
    );
  }
}
