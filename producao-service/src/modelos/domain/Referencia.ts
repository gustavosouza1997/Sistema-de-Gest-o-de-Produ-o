import { generateId } from '../../shared/domain/IdGenerator';
import { Operacao } from './Operacao';

export interface ReferenciaProps {
  id: string;
  nome: string;
  operacoesAdicionais: Operacao[];
}

export class Referencia {
  readonly id: string;
  readonly nome: string;
  readonly operacoesAdicionais: Operacao[];

  private constructor(props: ReferenciaProps) {
    Object.assign(this, props);
  }

  static criar(nome: string): Referencia {
    return new Referencia({ id: generateId(), nome, operacoesAdicionais: [] });
  }

  static reconstituir(props: ReferenciaProps): Referencia {
    return new Referencia(props);
  }

  adicionarOperacao(descricao: string, tempo: number): Referencia {
    const ordem = this.operacoesAdicionais.length + 1;
    const op = Operacao.criar({ descricao, tempo, ordem });
    return Referencia.reconstituir({ ...this, operacoesAdicionais: [...this.operacoesAdicionais, op] });
  }

  renomear(nome: string): Referencia {
    return Referencia.reconstituir({ ...this, nome });
  }

  editarOperacao(operacaoId: string, descricao: string, tempo: number): Referencia {
    if (!this.operacoesAdicionais.find((op) => op.id === operacaoId)) throw new Error('Operação não encontrada');
    return Referencia.reconstituir({
      ...this,
      operacoesAdicionais: this.operacoesAdicionais.map((op) =>
        op.id === operacaoId ? Operacao.reconstituir({ ...op, descricao, tempo }) : op,
      ),
    });
  }

  removerOperacao(operacaoId: string): Referencia {
    if (!this.operacoesAdicionais.find((op) => op.id === operacaoId)) throw new Error('Operação não encontrada');
    const restante = this.operacoesAdicionais
      .filter((op) => op.id !== operacaoId)
      .map((op, i) => Operacao.reconstituir({ ...op, ordem: i + 1 }));
    return Referencia.reconstituir({ ...this, operacoesAdicionais: restante });
  }

  tempoTotal(roteiro: Operacao[]): number {
    return round3([...roteiro, ...this.operacoesAdicionais].reduce((s, op) => s + op.tempo, 0));
  }

  custoPorMinutoPago(preco: number, roteiro: Operacao[]): number {
    const total = this.tempoTotal(roteiro);
    return total === 0 ? 0 : round3(preco / total);
  }

  precoPrevisto(custoPorMinutoPrevisto: number, roteiro: Operacao[]): number {
    return round3(this.tempoTotal(roteiro) * custoPorMinutoPrevisto);
  }
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
