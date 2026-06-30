import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { generateId } from '../../shared/domain/IdGenerator';
import { Operacao } from './Operacao';
import { Referencia } from './Referencia';
import { ModeloCriado } from './events/ModeloCriado';
import { ModeloDesativado } from './events/ModeloDesativado';
import { ModeloReativado } from './events/ModeloReativado';

export interface CriarModeloProps {
  empresaId: string;
  sigla: string;
  linha: string;
  preco: number;
  producaoPorDia: number;
  turno: number;
  custoPorMinutoPrevisto: number;
}

export interface ModeloProps extends CriarModeloProps {
  id: string;
  roteiro: Operacao[];
  referencias: Referencia[];
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class Modelo extends AggregateRoot {
  readonly id: string;
  readonly empresaId: string;
  readonly sigla: string;
  readonly linha: string;
  readonly preco: number;
  readonly producaoPorDia: number;
  readonly turno: number;
  readonly custoPorMinutoPrevisto: number;
  readonly roteiro: Operacao[];
  readonly referencias: Referencia[];
  readonly ativo: boolean;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;

  private constructor(props: ModeloProps) {
    super();
    Object.assign(this, props);
  }

  static criar(props: CriarModeloProps): Modelo {
    const modelo = new Modelo({
      ...props,
      id: generateId(),
      roteiro: [],
      referencias: [],
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    modelo.addEvent(new ModeloCriado(modelo.id, modelo.empresaId, modelo.sigla, modelo.linha));
    return modelo;
  }

  static reconstituir(props: ModeloProps): Modelo {
    return new Modelo(props);
  }

  adicionarOperacaoAoRoteiro(descricao: string, tempo: number): Modelo {
    const ordem = this.roteiro.length + 1;
    const op = Operacao.criar({ descricao, tempo, ordem });
    return Modelo.reconstituir({ ...this.toProps(), roteiro: [...this.roteiro, op], atualizadoEm: new Date() });
  }

  adicionarReferencia(nome: string): Modelo {
    const ref = Referencia.criar(nome);
    return Modelo.reconstituir({ ...this.toProps(), referencias: [...this.referencias, ref], atualizadoEm: new Date() });
  }

  adicionarOperacaoAReferencia(referenciaId: string, descricao: string, tempo: number): Modelo {
    const ref = this.referencias.find((r) => r.id === referenciaId);
    if (!ref) throw new Error('Referência não encontrada');
    const updatedRef = ref.adicionarOperacao(descricao, tempo);
    return Modelo.reconstituir({
      ...this.toProps(),
      referencias: this.referencias.map((r) => (r.id === referenciaId ? updatedRef : r)),
      atualizadoEm: new Date(),
    });
  }

  editarOperacaoDoRoteiro(operacaoId: string, descricao: string, tempo: number): Modelo {
    if (!this.roteiro.find((op) => op.id === operacaoId)) throw new Error('Operação não encontrada no roteiro');
    return Modelo.reconstituir({
      ...this.toProps(),
      roteiro: this.roteiro.map((op) =>
        op.id === operacaoId ? Operacao.reconstituir({ ...op, descricao, tempo }) : op,
      ),
      atualizadoEm: new Date(),
    });
  }

  removerOperacaoDoRoteiro(operacaoId: string): Modelo {
    if (!this.roteiro.find((op) => op.id === operacaoId)) throw new Error('Operação não encontrada no roteiro');
    const restante = this.roteiro
      .filter((op) => op.id !== operacaoId)
      .map((op, i) => Operacao.reconstituir({ ...op, ordem: i + 1 }));
    return Modelo.reconstituir({ ...this.toProps(), roteiro: restante, atualizadoEm: new Date() });
  }

  editarReferencia(referenciaId: string, nome: string): Modelo {
    const ref = this.referencias.find((r) => r.id === referenciaId);
    if (!ref) throw new Error('Referência não encontrada');
    return Modelo.reconstituir({
      ...this.toProps(),
      referencias: this.referencias.map((r) => (r.id === referenciaId ? r.renomear(nome) : r)),
      atualizadoEm: new Date(),
    });
  }

  removerReferencia(referenciaId: string): Modelo {
    if (!this.referencias.find((r) => r.id === referenciaId)) throw new Error('Referência não encontrada');
    return Modelo.reconstituir({
      ...this.toProps(),
      referencias: this.referencias.filter((r) => r.id !== referenciaId),
      atualizadoEm: new Date(),
    });
  }

  editarOperacaoDeReferencia(referenciaId: string, operacaoId: string, descricao: string, tempo: number): Modelo {
    const ref = this.referencias.find((r) => r.id === referenciaId);
    if (!ref) throw new Error('Referência não encontrada');
    return Modelo.reconstituir({
      ...this.toProps(),
      referencias: this.referencias.map((r) => (r.id === referenciaId ? r.editarOperacao(operacaoId, descricao, tempo) : r)),
      atualizadoEm: new Date(),
    });
  }

  removerOperacaoDeReferencia(referenciaId: string, operacaoId: string): Modelo {
    const ref = this.referencias.find((r) => r.id === referenciaId);
    if (!ref) throw new Error('Referência não encontrada');
    return Modelo.reconstituir({
      ...this.toProps(),
      referencias: this.referencias.map((r) => (r.id === referenciaId ? r.removerOperacao(operacaoId) : r)),
      atualizadoEm: new Date(),
    });
  }

  tempoTotalBase(): number {
    return Math.round(this.roteiro.reduce((s, op) => s + op.tempo, 0) * 1000) / 1000;
  }

  atualizar(props: Pick<CriarModeloProps, 'sigla' | 'linha' | 'preco' | 'producaoPorDia' | 'turno' | 'custoPorMinutoPrevisto'>): Modelo {
    return Modelo.reconstituir({ ...this.toProps(), ...props, atualizadoEm: new Date() });
  }

  desativar(): Modelo {
    if (!this.ativo) throw new Error('Modelo já está inativo');
    const updated = Modelo.reconstituir({ ...this.toProps(), ativo: false, atualizadoEm: new Date() });
    updated.addEvent(new ModeloDesativado(this.id));
    return updated;
  }

  reativar(): Modelo {
    if (this.ativo) throw new Error('Modelo já está ativo');
    const updated = Modelo.reconstituir({ ...this.toProps(), ativo: true, atualizadoEm: new Date() });
    updated.addEvent(new ModeloReativado(this.id));
    return updated;
  }

  private toProps(): ModeloProps {
    return {
      id: this.id, empresaId: this.empresaId, sigla: this.sigla, linha: this.linha,
      preco: this.preco, producaoPorDia: this.producaoPorDia, turno: this.turno,
      custoPorMinutoPrevisto: this.custoPorMinutoPrevisto, roteiro: this.roteiro,
      referencias: this.referencias, ativo: this.ativo, criadoEm: this.criadoEm,
      atualizadoEm: this.atualizadoEm,
    };
  }
}
