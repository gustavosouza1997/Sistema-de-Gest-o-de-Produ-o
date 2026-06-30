import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DesativarEmpresaCommand } from './DesativarEmpresa.command';
import { EMPRESA_REPOSITORY, EmpresaRepository } from '../../domain/EmpresaRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';

@CommandHandler(DesativarEmpresaCommand)
export class DesativarEmpresaHandler implements ICommandHandler<DesativarEmpresaCommand, void> {
  constructor(
    @Inject(EMPRESA_REPOSITORY) private readonly empresaRepo: EmpresaRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: DesativarEmpresaCommand): Promise<void> {
    const empresa = await this.empresaRepo.findById(command.id);
    if (!empresa) throw new NotFoundException(`Empresa ${command.id} não encontrada`);

    const desativada = empresa.desativar();
    await this.empresaRepo.save(desativada);
    await this.eventStore.append(`empresa-${desativada.id}`, desativada.pullEvents());
  }
}
