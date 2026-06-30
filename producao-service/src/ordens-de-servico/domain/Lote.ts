import { generateId } from '../../shared/domain/IdGenerator';

export type EtapaFabricacao = 'preparo' | 'costura' | 'revisao_conserto' | 'entregue';

const SEQUENCIA: EtapaFabricacao[] = ['preparo', 'costura', 'revisao_conserto', 'entregue'];

export interface LoteProps {
  id: string;
  identificador: string;
  codigoBarras?: string;
  modeloId: string;
  quantidade: number;
  etapa: EtapaFabricacao;
}

export class Lote {
  readonly id: string;
  readonly identificador: string;
  readonly codigoBarras?: string;
  readonly modeloId: string;
  readonly quantidade: number;
  readonly etapa: EtapaFabricacao;

  private constructor(props: LoteProps) {
    Object.assign(this, props);
  }

  static criar(props: Omit<LoteProps, 'id' | 'etapa'>): Lote {
    return new Lote({ ...props, id: generateId(), etapa: 'preparo' });
  }

  static reconstituir(props: LoteProps): Lote {
    return new Lote(props);
  }

  editar(identificador: string, codigoBarras: string | undefined, modeloId: string, quantidade: number): Lote {
    return Lote.reconstituir({ id: this.id, identificador, codigoBarras, modeloId, quantidade, etapa: this.etapa });
  }

  avancarEtapa(): Lote {
    const idx = SEQUENCIA.indexOf(this.etapa);
    if (idx === SEQUENCIA.length - 1) throw new Error('Lote já está na etapa final');
    return Lote.reconstituir({ ...this, etapa: SEQUENCIA[idx + 1] });
  }
}
