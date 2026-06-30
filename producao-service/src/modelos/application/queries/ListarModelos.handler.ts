import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListarModelosQuery } from './ListarModelos.query';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';

@QueryHandler(ListarModelosQuery)
export class ListarModelosHandler implements IQueryHandler<ListarModelosQuery> {
  constructor(@Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository) {}

  async execute(query: ListarModelosQuery) {
    const modelos = await this.modeloRepo.findAll({ empresaId: query.empresaId, ativo: query.ativo });
    return modelos.map((m) => ({
      id: m.id,
      empresaId: m.empresaId,
      sigla: m.sigla,
      linha: m.linha,
      preco: m.preco,
      producaoPorDia: m.producaoPorDia,
      turno: m.turno,
      custoPorMinutoPrevisto: m.custoPorMinutoPrevisto,
      tempoTotalBase: m.tempoTotalBase(),
      totalReferencias: m.referencias.length,
      ativo: m.ativo,
    }));
  }
}
