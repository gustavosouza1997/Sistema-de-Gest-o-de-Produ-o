import { generateId } from '../../shared/domain/IdGenerator';

export interface OperacaoProps {
  id: string;
  descricao: string;
  tempo: number;
  ordem: number;
}

export class Operacao {
  readonly id: string;
  readonly descricao: string;
  readonly tempo: number;
  readonly ordem: number;

  private constructor(props: OperacaoProps) {
    Object.assign(this, props);
  }

  static criar(props: Omit<OperacaoProps, 'id'>): Operacao {
    return new Operacao({ ...props, id: generateId() });
  }

  static reconstituir(props: OperacaoProps): Operacao {
    return new Operacao(props);
  }

  metaPorHora(): number {
    return round3(60 / this.tempo);
  }

  metaPorDia(turno: number): number {
    return round3(turno / this.tempo);
  }

  pessoalCalculado(producaoPorDia: number, turno: number): number {
    return round3((producaoPorDia * this.tempo) / turno);
  }
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
