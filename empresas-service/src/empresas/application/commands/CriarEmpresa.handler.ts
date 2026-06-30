import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Inject } from '@nestjs/common';
import { CriarEmpresaCommand } from './CriarEmpresa.command';
import { Empresa } from '../../domain/Empresa';
import { EMPRESA_REPOSITORY, EmpresaRepository } from '../../domain/EmpresaRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';

@CommandHandler(CriarEmpresaCommand)
export class CriarEmpresaHandler implements ICommandHandler<CriarEmpresaCommand, string> {
  constructor(
    @Inject(EMPRESA_REPOSITORY) private readonly empresaRepo: EmpresaRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: CriarEmpresaCommand): Promise<string> {
    const existing = await this.empresaRepo.findByCnpj(command.cnpj);
    if (existing) throw new ConflictException(`CNPJ ${command.cnpj} já cadastrado`);

    const empresa = Empresa.criar(command);
    await this.empresaRepo.save(empresa);
    await this.eventStore.append(`empresa-${empresa.id}`, empresa.pullEvents());

    return empresa.id;
  }
}
