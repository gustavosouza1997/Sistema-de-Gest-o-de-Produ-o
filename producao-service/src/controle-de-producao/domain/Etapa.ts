import { generateId } from '../../shared/domain/IdGenerator';

export type StatusEtapa = 'pendente' | 'em_andamento' | 'concluida' | 'bloqueada';

export interface EtapaProps {
  id: string;
  controleId: string;
  nome: string;
  ordem: number;
  status: StatusEtapa;
  operadorId?: string;
  inicioReal?: Date;
  conclusaoReal?: Date;
  observacao?: string;
}

export class Etapa {
  readonly id: string;
  readonly controleId: string;
  readonly nome: string;
  readonly ordem: number;
  readonly status: StatusEtapa;
  readonly operadorId?: string;
  readonly inicioReal?: Date;
  readonly conclusaoReal?: Date;
  readonly observacao?: string;

  private constructor(props: EtapaProps) {
    Object.assign(this, props);
  }

  static criar(props: Omit<EtapaProps, 'id' | 'status'>): Etapa {
    return new Etapa({ ...props, id: generateId(), status: 'pendente' });
  }

  static reconstituir(props: EtapaProps): Etapa {
    return new Etapa(props);
  }

  concluir(operadorId: string, observacao?: string): Etapa {
    return Etapa.reconstituir({
      ...this,
      status: 'concluida',
      operadorId,
      conclusaoReal: new Date(),
      observacao,
    });
  }
}
