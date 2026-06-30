import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListarOrdensQuery } from './ListarOrdens.query';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';
import { OrdemDeServico } from '../../domain/OrdemDeServico';

@QueryHandler(ListarOrdensQuery)
export class ListarOrdensHandler implements IQueryHandler<ListarOrdensQuery> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(query: ListarOrdensQuery) {
    const ordens = await this.repo.findAll({ empresaId: query.empresaId, status: query.status });
    return ordens.map(toDto);
  }
}

function toDto(o: OrdemDeServico) {
  return {
    id: o.id, empresaId: o.empresaId, notaFiscalOrigem: o.notaFiscalOrigem,
    numero: o.numero, status: o.status,
    totalRemessas: o.remessas.length, totalPares: o.totalPares,
    criadaEm: o.criadaEm, abertura: o.abertura, conclusao: o.conclusao,
  };
}
