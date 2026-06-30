import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { BuscarModeloQuery } from './BuscarModelo.query';
import { MODELO_REPOSITORY, ModeloRepository } from '../../domain/ModeloRepository.port';

@QueryHandler(BuscarModeloQuery)
export class BuscarModeloHandler implements IQueryHandler<BuscarModeloQuery> {
  constructor(@Inject(MODELO_REPOSITORY) private readonly modeloRepo: ModeloRepository) {}

  async execute(query: BuscarModeloQuery) {
    const modelo = await this.modeloRepo.findById(query.id);
    if (!modelo) throw new NotFoundException(`Modelo ${query.id} não encontrado`);

    return {
      id: modelo.id,
      empresaId: modelo.empresaId,
      sigla: modelo.sigla,
      linha: modelo.linha,
      preco: modelo.preco,
      producaoPorDia: modelo.producaoPorDia,
      turno: modelo.turno,
      custoPorMinutoPrevisto: modelo.custoPorMinutoPrevisto,
      ativo: modelo.ativo,
      tempoTotalBase: modelo.tempoTotalBase(),
      roteiro: modelo.roteiro.map((op) => ({
        id: op.id,
        descricao: op.descricao,
        tempo: op.tempo,
        ordem: op.ordem,
        metaPorHora: op.metaPorHora(),
        metaPorDia: op.metaPorDia(modelo.turno),
        pessoalCalculado: op.pessoalCalculado(modelo.producaoPorDia, modelo.turno),
      })),
      referencias: modelo.referencias.map((ref) => ({
        id: ref.id,
        nome: ref.nome,
        tempoTotal: ref.tempoTotal(modelo.roteiro),
        custoPorMinutoPago: ref.custoPorMinutoPago(modelo.preco, modelo.roteiro),
        precoPrevisto: ref.precoPrevisto(modelo.custoPorMinutoPrevisto, modelo.roteiro),
        operacoesAdicionais: ref.operacoesAdicionais.map((op) => ({
          id: op.id,
          descricao: op.descricao,
          tempo: op.tempo,
          ordem: op.ordem,
          metaPorHora: op.metaPorHora(),
          metaPorDia: op.metaPorDia(modelo.turno),
          pessoalCalculado: op.pessoalCalculado(modelo.producaoPorDia, modelo.turno),
        })),
      })),
    };
  }
}
