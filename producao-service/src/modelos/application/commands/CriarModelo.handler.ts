import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Inject } from '@nestjs/common';
import { CriarModeloCommand } from './CriarModelo.command';
import { Modelo } from '../../domain/Modelo';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';
import { commandsTotal } from '../../../shared/metrics/metrics';

@CommandHandler(CriarModeloCommand)
export class CriarModeloHandler implements ICommandHandler<CriarModeloCommand, string> {
  constructor(
    @Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: CriarModeloCommand): Promise<string> {
    const existing = await this.modeloRepo.findBySigla(command.empresaId, command.sigla);
    if (existing) {
      commandsTotal.inc({ command: 'CriarModelo', status: 'conflict' });
      throw new ConflictException(`Sigla ${command.sigla} já existe para esta empresa`);
    }

    const modelo = Modelo.criar(command);
    await this.modeloRepo.save(modelo);
    await this.eventStore.append(`modelo-${modelo.id}`, modelo.pullEvents());

    commandsTotal.inc({ command: 'CriarModelo', status: 'success' });
    return modelo.id;
  }
}
