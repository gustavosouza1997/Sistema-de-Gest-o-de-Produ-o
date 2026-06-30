import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ReativarEmpresaCommand } from './ReativarEmpresa.command';
import { EMPRESA_REPOSITORY, EmpresaRepository } from '../../domain/EmpresaRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';

@CommandHandler(ReativarEmpresaCommand)
export class ReativarEmpresaHandler implements ICommandHandler<ReativarEmpresaCommand, void> {
  constructor(
    @Inject(EMPRESA_REPOSITORY) private readonly empresaRepo: EmpresaRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: ReativarEmpresaCommand): Promise<void> {
    const empresa = await this.empresaRepo.findById(command.id);
    if (!empresa) throw new NotFoundException(`Empresa ${command.id} não encontrada`);

    const reativada = empresa.reativar();
    await this.empresaRepo.save(reativada);
    await this.eventStore.append(`empresa-${reativada.id}`, reativada.pullEvents());
  }
}
