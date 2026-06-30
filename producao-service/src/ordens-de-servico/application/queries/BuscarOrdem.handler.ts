import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { BuscarOrdemQuery } from './BuscarOrdem.query';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';
import { OrdemDeServico } from '../../domain/OrdemDeServico';
import { Remessa } from '../../domain/Remessa';
import { Lote } from '../../domain/Lote';

@QueryHandler(BuscarOrdemQuery)
export class BuscarOrdemHandler implements IQueryHandler<BuscarOrdemQuery> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(query: BuscarOrdemQuery) {
    const o = await this.repo.findById(query.id);
    if (!o) throw new NotFoundException(`Ordem ${query.id} não encontrada`);
    return toDto(o);
  }
}

function loteDto(l: Lote) {
  return { id: l.id, identificador: l.identificador, codigoBarras: l.codigoBarras, modeloId: l.modeloId, quantidade: l.quantidade, etapa: l.etapa };
}

function remessaDto(r: Remessa) {
  return { id: r.id, nome: r.nome, lotes: r.lotes.map(loteDto), totalPares: r.totalPares };
}

function toDto(o: OrdemDeServico) {
  return {
    id: o.id, empresaId: o.empresaId, notaFiscalOrigem: o.notaFiscalOrigem,
    numero: o.numero, status: o.status,
    remessas: o.remessas.map(remessaDto), totalPares: o.totalPares,
    criadaEm: o.criadaEm, abertura: o.abertura, conclusao: o.conclusao,
  };
}
