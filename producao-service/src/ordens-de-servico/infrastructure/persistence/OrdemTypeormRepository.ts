import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdemDeServico } from '../../domain/OrdemDeServico';
import { Lote, EtapaFabricacao } from '../../domain/Lote';
import { OrdemRepository, LoteLocalizadoPorBarcode } from '../../domain/OrdemRepository.port';
import { EventStore } from '../../../shared/event-store/EventStore';
import { OrdemEntity } from './OrdemEntity';
import { ordensGauge, lotesPorEtapaGauge } from '../../../shared/metrics/metrics';

@Injectable()
export class OrdemTypeormRepository implements OrdemRepository {
  constructor(
    @InjectRepository(OrdemEntity)
    private readonly repo: Repository<OrdemEntity>,
    private readonly eventStore: EventStore,
  ) {}

  async save(ordem: OrdemDeServico): Promise<void> {
    const events = ordem.pullEvents();
    if (!events.length) return;

    await this.eventStore.append(`ordem-${ordem.id}`, events);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.repo.save as any)({
      id: ordem.id,
      empresaId: ordem.empresaId,
      notaFiscalOrigem: ordem.notaFiscalOrigem,
      numero: ordem.numero,
      status: ordem.status,
      criadaEm: ordem.criadaEm,
      abertura: ordem.abertura,
      conclusao: ordem.conclusao,
      remessas: ordem.remessas.map((r) => ({
        id: r.id,
        ordemId: ordem.id,
        nome: r.nome,
        lotes: r.lotes.map((l) => ({
          id: l.id,
          remessaId: r.id,
          identificador: l.identificador,
          codigoBarras: l.codigoBarras || null,
          modeloId: l.modeloId,
          quantidade: l.quantidade,
          etapa: l.etapa,
        })),
      })),
    });
  }

  async findById(id: string): Promise<OrdemDeServico | null> {
    const records = await this.eventStore.getStream(`ordem-${id}`);
    if (!records.length) return null;
    return OrdemDeServico.reconstituirDeEventos(records);
  }

  async findAll(filters?: { empresaId?: string; status?: string }): Promise<OrdemDeServico[]> {
    const where: Record<string, unknown> = {};
    if (filters?.empresaId) where['empresaId'] = filters.empresaId;
    if (filters?.status)    where['status']    = filters.status;
    const entities = await this.repo.find({ where, order: { criadaEm: 'DESC' } });

    const ordens = await Promise.all(
      entities.map((e) => this.eventStore.getStream(`ordem-${e.id}`).then(OrdemDeServico.reconstituirDeEventos)),
    );
    return ordens;
  }

  async nextNumero(ano: number): Promise<string> {
    const count = await this.repo
      .createQueryBuilder('o')
      .where('EXTRACT(YEAR FROM o.criada_em) = :ano', { ano })
      .getCount();
    return `OS-${ano}-${String(count + 1).padStart(4, '0')}`;
  }

  async findByCodigoBarras(codigo: string): Promise<LoteLocalizadoPorBarcode | null> {
    const rows: any[] = await this.repo.manager.query(
      `SELECT o.id AS "ordemId", o.numero AS "ordemNumero",
              r.id AS "remessaId", r.nome AS "remessaNome",
              l.id AS "loteId", l.identificador, l.etapa
       FROM lotes l
       JOIN remessas r ON r.id = l.remessa_id
       JOIN ordens_de_servico o ON o.id = r.ordem_id
       WHERE l.codigo_barras = $1
         AND o.status IN ('aberta', 'em_execucao')
       LIMIT 1`,
      [codigo],
    );
    if (!rows.length) return null;
    return {
      ordemId:       rows[0].ordemId,
      ordemNumero:   rows[0].ordemNumero,
      remessaId:     rows[0].remessaId,
      remessaNome:   rows[0].remessaNome,
      loteId:        rows[0].loteId,
      identificador: rows[0].identificador,
      etapa:         rows[0].etapa as EtapaFabricacao,
    };
  }
}
