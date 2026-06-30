import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { generateId } from '../../shared/domain/IdGenerator';
import { Remessa } from './Remessa';
import { Lote, EtapaFabricacao } from './Lote';
import { OrdemCriada } from './events/OrdemCriada';
import { OrdemAberta } from './events/OrdemAberta';
import { OrdemEmExecucao } from './events/OrdemEmExecucao';
import { OrdemConcluida } from './events/OrdemConcluida';
import { OrdemCancelada } from './events/OrdemCancelada';
import { RemessaAdicionada } from './events/RemessaAdicionada';
import { RemessaRemovida } from './events/RemessaRemovida';
import { LoteAdicionado } from './events/LoteAdicionado';
import { LoteEditado } from './events/LoteEditado';
import { LoteRemovido } from './events/LoteRemovido';
import { EtapaLoteAvancada } from './events/EtapaLoteAvancada';

export type StatusOS = 'rascunho' | 'aberta' | 'em_execucao' | 'concluida' | 'cancelada';

export interface CriarOrdemProps {
  empresaId: string;
  notaFiscalOrigem: string;
}

export interface OrdemProps extends CriarOrdemProps {
  id: string;
  numero: string;
  status: StatusOS;
  remessas: Remessa[];
  criadaEm: Date;
  abertura?: Date;
  conclusao?: Date;
}

interface EventRecord {
  eventType: string;
  payload: Record<string, unknown>;
}

export class OrdemDeServico extends AggregateRoot {
  readonly id: string;
  readonly empresaId: string;
  readonly notaFiscalOrigem: string;
  readonly numero: string;
  readonly status: StatusOS;
  readonly remessas: Remessa[];
  readonly criadaEm: Date;
  readonly abertura?: Date;
  readonly conclusao?: Date;

  private constructor(props: OrdemProps) {
    super();
    Object.assign(this, props);
  }

  static criar(props: CriarOrdemProps, numero: string): OrdemDeServico {
    const criadaEm = new Date();
    const ordem = new OrdemDeServico({
      ...props, id: generateId(), numero, status: 'rascunho', remessas: [], criadaEm,
    });
    ordem.addEvent(new OrdemCriada(ordem.id, ordem.empresaId, ordem.notaFiscalOrigem, ordem.numero, criadaEm));
    return ordem;
  }

  static reconstituir(props: OrdemProps): OrdemDeServico {
    return new OrdemDeServico(props);
  }

  static reconstituirDeEventos(records: EventRecord[]): OrdemDeServico {
    if (!records.length) throw new Error('Stream vazio — ordem não encontrada');

    let props: any = { remessas: [] };

    for (const { eventType, payload: p } of records) {
      switch (eventType) {
        case 'OrdemCriada':
          props = {
            id: p['aggregateId'],
            empresaId: p['empresaId'],
            notaFiscalOrigem: p['notaFiscalOrigem'],
            numero: p['numero'],
            status: 'rascunho',
            remessas: [],
            criadaEm: new Date(p['criadaEm'] as string),
          };
          break;

        case 'OrdemAberta':
          props.status = 'aberta';
          props.abertura = p['abertura'] ? new Date(p['abertura'] as string) : new Date();
          break;

        case 'OrdemEmExecucao':
          props.status = 'em_execucao';
          break;

        case 'OrdemConcluida':
          props.status = 'concluida';
          props.conclusao = p['conclusao'] ? new Date(p['conclusao'] as string) : new Date();
          break;

        case 'OrdemCancelada':
          props.status = 'cancelada';
          break;

        case 'RemessaAdicionada':
          props.remessas = [
            ...props.remessas,
            Remessa.reconstituir({ id: p['remessaId'] as string, nome: p['nome'] as string, lotes: [] }),
          ];
          break;

        case 'RemessaRemovida':
          props.remessas = (props.remessas as Remessa[]).filter((r) => r.id !== p['remessaId']);
          break;

        case 'LoteAdicionado':
          props.remessas = (props.remessas as Remessa[]).map((r) =>
            r.id !== p['remessaId'] ? r : Remessa.reconstituir({
              ...r,
              lotes: [...r.lotes, Lote.reconstituir({
                id: p['loteId'] as string,
                identificador: p['identificador'] as string,
                codigoBarras: p['codigoBarras'] as string | undefined,
                modeloId: p['modeloId'] as string,
                quantidade: p['quantidade'] as number,
                etapa: 'preparo',
              })],
            }),
          );
          break;

        case 'LoteEditado':
          props.remessas = (props.remessas as Remessa[]).map((r) =>
            r.id !== p['remessaId'] ? r : Remessa.reconstituir({
              ...r,
              lotes: r.lotes.map((l) =>
                l.id !== p['loteId'] ? l : Lote.reconstituir({
                  id: l.id,
                  identificador: p['identificador'] as string,
                  codigoBarras: p['codigoBarras'] as string | undefined,
                  modeloId: p['modeloId'] as string,
                  quantidade: p['quantidade'] as number,
                  etapa: l.etapa,
                }),
              ),
            }),
          );
          break;

        case 'LoteRemovido':
          props.remessas = (props.remessas as Remessa[]).map((r) =>
            r.id !== p['remessaId'] ? r : Remessa.reconstituir({
              ...r,
              lotes: r.lotes.filter((l) => l.id !== p['loteId']),
            }),
          );
          break;

        case 'EtapaLoteAvancada':
          props.remessas = (props.remessas as Remessa[]).map((r) =>
            r.id !== p['remessaId'] ? r : Remessa.reconstituir({
              ...r,
              lotes: r.lotes.map((l) =>
                l.id !== p['loteId'] ? l : Lote.reconstituir({ ...l, etapa: p['etapaAtual'] as EtapaFabricacao }),
              ),
            }),
          );
          break;
      }
    }

    return new OrdemDeServico(props as OrdemProps);
  }

  get totalPares(): number {
    return this.remessas.reduce((sum, r) => sum + r.totalPares, 0);
  }

  // ── status ────────────────────────────────────────────────────────────────────
  abrir(): OrdemDeServico {
    if (this.status !== 'rascunho') throw new Error('Apenas ordens em rascunho podem ser abertas');
    const abertura = new Date();
    const updated = OrdemDeServico.reconstituir({ ...this.toProps(), status: 'aberta', abertura });
    updated.addEvent(new OrdemAberta(this.id, abertura));
    return updated;
  }

  iniciarExecucao(): OrdemDeServico {
    if (this.status !== 'aberta') throw new Error('Apenas ordens abertas podem ser iniciadas');
    const updated = OrdemDeServico.reconstituir({ ...this.toProps(), status: 'em_execucao' });
    updated.addEvent(new OrdemEmExecucao(this.id));
    return updated;
  }

  concluir(): OrdemDeServico {
    if (this.status !== 'em_execucao') throw new Error('Apenas ordens em execução podem ser concluídas');
    const conclusao = new Date();
    const updated = OrdemDeServico.reconstituir({ ...this.toProps(), status: 'concluida', conclusao });
    updated.addEvent(new OrdemConcluida(this.id, conclusao));
    return updated;
  }

  cancelar(): OrdemDeServico {
    if (this.status === 'concluida' || this.status === 'cancelada') throw new Error('Não é possível cancelar esta ordem');
    const updated = OrdemDeServico.reconstituir({ ...this.toProps(), status: 'cancelada' });
    updated.addEvent(new OrdemCancelada(this.id));
    return updated;
  }

  // ── remessas ──────────────────────────────────────────────────────────────────
  adicionarRemessa(nome: string): OrdemDeServico {
    const remessa = Remessa.criar(nome);
    const updated = OrdemDeServico.reconstituir({ ...this.toProps(), remessas: [...this.remessas, remessa] });
    updated.addEvent(new RemessaAdicionada(this.id, remessa.id, remessa.nome));
    return updated;
  }

  removerRemessa(remessaId: string): OrdemDeServico {
    if (!this.remessas.find((r) => r.id === remessaId)) throw new Error('Remessa não encontrada');
    const updated = OrdemDeServico.reconstituir({ ...this.toProps(), remessas: this.remessas.filter((r) => r.id !== remessaId) });
    updated.addEvent(new RemessaRemovida(this.id, remessaId));
    return updated;
  }

  // ── lotes ─────────────────────────────────────────────────────────────────────
  adicionarLote(remessaId: string, identificador: string, codigoBarras: string | undefined, modeloId: string, quantidade: number): OrdemDeServico {
    const r = this.remessas.find((r) => r.id === remessaId);
    if (!r) throw new Error('Remessa não encontrada');
    const loteId = generateId();
    const updated = OrdemDeServico.reconstituir({
      ...this.toProps(),
      remessas: this.remessas.map((r) => r.id === remessaId ? r.adicionarLote(loteId, identificador, codigoBarras, modeloId, quantidade) : r),
    });
    updated.addEvent(new LoteAdicionado(this.id, remessaId, loteId, identificador, codigoBarras, modeloId, quantidade));
    return updated;
  }

  editarLote(remessaId: string, loteId: string, identificador: string, codigoBarras: string | undefined, modeloId: string, quantidade: number): OrdemDeServico {
    const r = this.remessas.find((r) => r.id === remessaId);
    if (!r) throw new Error('Remessa não encontrada');
    const updated = OrdemDeServico.reconstituir({
      ...this.toProps(),
      remessas: this.remessas.map((r) => r.id === remessaId ? r.editarLote(loteId, identificador, codigoBarras, modeloId, quantidade) : r),
    });
    updated.addEvent(new LoteEditado(this.id, remessaId, loteId, identificador, codigoBarras, modeloId, quantidade));
    return updated;
  }

  removerLote(remessaId: string, loteId: string): OrdemDeServico {
    const r = this.remessas.find((r) => r.id === remessaId);
    if (!r) throw new Error('Remessa não encontrada');
    const updated = OrdemDeServico.reconstituir({
      ...this.toProps(),
      remessas: this.remessas.map((r) => r.id === remessaId ? r.removerLote(loteId) : r),
    });
    updated.addEvent(new LoteRemovido(this.id, remessaId, loteId));
    return updated;
  }

  avancarEtapaLote(remessaId: string, loteId: string): OrdemDeServico {
    const r = this.remessas.find((r) => r.id === remessaId);
    if (!r) throw new Error('Remessa não encontrada');
    const lote = r.lotes.find((l) => l.id === loteId);
    if (!lote) throw new Error('Lote não encontrado');
    const etapaAnterior = lote.etapa;
    const updated = OrdemDeServico.reconstituir({
      ...this.toProps(),
      remessas: this.remessas.map((r) => r.id === remessaId ? r.avancarEtapaLote(loteId) : r),
    });
    const etapaAtual = updated.remessas.find((r) => r.id === remessaId)!.lotes.find((l) => l.id === loteId)!.etapa;
    updated.addEvent(new EtapaLoteAvancada(this.id, remessaId, loteId, etapaAnterior, etapaAtual));
    return updated;
  }

  private toProps(): OrdemProps {
    return {
      id: this.id, empresaId: this.empresaId, notaFiscalOrigem: this.notaFiscalOrigem,
      numero: this.numero, status: this.status, remessas: this.remessas,
      criadaEm: this.criadaEm, abertura: this.abertura, conclusao: this.conclusao,
    };
  }
}
