import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { AtualizarEmpresaCommand } from './AtualizarEmpresa.command';
import { EMPRESA_REPOSITORY, EmpresaRepository } from '../../domain/EmpresaRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';

@CommandHandler(AtualizarEmpresaCommand)
export class AtualizarEmpresaHandler implements ICommandHandler<AtualizarEmpresaCommand, void> {
  constructor(
    @Inject(EMPRESA_REPOSITORY) private readonly empresaRepo: EmpresaRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: AtualizarEmpresaCommand): Promise<void> {
    const empresa = await this.empresaRepo.findById(command.id);
    if (!empresa) throw new NotFoundException(`Empresa ${command.id} não encontrada`);

    if (command.campos.cnpj && command.campos.cnpj !== empresa.cnpj) {
      const conflito = await this.empresaRepo.findByCnpj(command.campos.cnpj);
      if (conflito) throw new ConflictException(`CNPJ ${command.campos.cnpj} já cadastrado`);
    }

    const updated = empresa.atualizar(command.campos);
    await this.empresaRepo.save(updated);
    await this.eventStore.append(`empresa-${updated.id}`, updated.pullEvents());
  }
}
