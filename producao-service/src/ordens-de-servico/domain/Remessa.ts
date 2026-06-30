import { generateId } from '../../shared/domain/IdGenerator';
import { Lote } from './Lote';

export interface RemessaProps {
  id: string;
  nome: string;
  lotes: Lote[];
}

export class Remessa {
  readonly id: string;
  readonly nome: string;
  readonly lotes: Lote[];

  private constructor(props: RemessaProps) {
    Object.assign(this, props);
  }

  static criar(nome: string): Remessa {
    return new Remessa({ id: generateId(), nome, lotes: [] });
  }

  static reconstituir(props: RemessaProps): Remessa {
    return new Remessa(props);
  }

  get totalPares(): number {
    return this.lotes.reduce((sum, l) => sum + l.quantidade, 0);
  }

  renomear(nome: string): Remessa {
    return Remessa.reconstituir({ ...this, nome });
  }

  adicionarLote(id: string, identificador: string, codigoBarras: string | undefined, modeloId: string, quantidade: number): Remessa {
    const lote = Lote.reconstituir({ id, identificador, codigoBarras, modeloId, quantidade, etapa: 'preparo' });
    return Remessa.reconstituir({ ...this, lotes: [...this.lotes, lote] });
  }

  editarLote(loteId: string, identificador: string, codigoBarras: string | undefined, modeloId: string, quantidade: number): Remessa {
    if (!this.lotes.find((l) => l.id === loteId)) throw new Error('Lote não encontrado');
    return Remessa.reconstituir({
      ...this,
      lotes: this.lotes.map((l) => (l.id === loteId ? l.editar(identificador, codigoBarras, modeloId, quantidade) : l)),
    });
  }

  removerLote(loteId: string): Remessa {
    if (!this.lotes.find((l) => l.id === loteId)) throw new Error('Lote não encontrado');
    return Remessa.reconstituir({ ...this, lotes: this.lotes.filter((l) => l.id !== loteId) });
  }

  avancarEtapaLote(loteId: string): Remessa {
    if (!this.lotes.find((l) => l.id === loteId)) throw new Error('Lote não encontrado');
    return Remessa.reconstituir({
      ...this,
      lotes: this.lotes.map((l) => (l.id === loteId ? l.avancarEtapa() : l)),
    });
  }
}
