import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { generateId } from '../../shared/domain/IdGenerator';
import { Etapa, StatusEtapa } from './Etapa';
import { ControleCriado } from './events/ControleCriado';
import { EtapaConcluida } from './events/EtapaConcluida';

export type StatusControle = 'pendente' | 'em_andamento' | 'concluido';

export interface ControleProps {
  id: string;
  ordemId: string;
  etapas: Etapa[];
  status: StatusControle;
  iniciadoEm?: Date;
  concluidoEm?: Date;
}

export class ControleDeProducao extends AggregateRoot {
  readonly id: string;
  readonly ordemId: string;
  readonly etapas: Etapa[];
  readonly status: StatusControle;
  readonly iniciadoEm?: Date;
  readonly concluidoEm?: Date;

  private constructor(props: ControleProps) {
    super();
    Object.assign(this, props);
  }

  static criar(ordemId: string, nomesEtapas: string[]): ControleDeProducao {
    const id = generateId();
    const etapas = nomesEtapas.map((nome, index) =>
      Etapa.criar({ controleId: id, nome, ordem: index + 1 }),
    );
    const controle = new ControleDeProducao({ id, ordemId, etapas, status: 'pendente' });
    controle.addEvent(new ControleCriado(id, ordemId));
    return controle;
  }

  static reconstituir(props: ControleProps): ControleDeProducao {
    return new ControleDeProducao(props);
  }

  get percentualConcluido(): number {
    if (this.etapas.length === 0) return 0;
    const concluidas = this.etapas.filter((e) => e.status === 'concluida').length;
    return Math.round((concluidas / this.etapas.length) * 100);
  }

  concluirEtapa(etapaId: string, operadorId: string, observacao?: string): ControleDeProducao {
    const etapa = this.etapas.find((e) => e.id === etapaId);
    if (!etapa) throw new Error('Etapa não encontrada');

    const novasEtapas = this.etapas.map((e) =>
      e.id === etapaId ? e.concluir(operadorId, observacao) : e,
    );

    const todasConcluidas = novasEtapas.every((e) => e.status === 'concluida');
    const novoStatus: StatusControle = todasConcluidas ? 'concluido' : 'em_andamento';

    const updated = ControleDeProducao.reconstituir({
      ...this,
      etapas: novasEtapas,
      status: novoStatus,
      concluidoEm: todasConcluidas ? new Date() : undefined,
    });
    updated.addEvent(new EtapaConcluida(this.id, etapaId, operadorId));
    return updated;
  }
}
