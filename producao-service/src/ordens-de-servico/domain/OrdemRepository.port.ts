import { OrdemDeServico } from './OrdemDeServico';
import { EtapaFabricacao } from './Lote';

export const ORDEM_REPOSITORY = Symbol('OrdemRepository');

export interface LoteLocalizadoPorBarcode {
  ordemId: string;
  ordemNumero: string;
  remessaId: string;
  remessaNome: string;
  loteId: string;
  identificador: string;
  etapa: EtapaFabricacao;
}

export interface OrdemRepository {
  save(ordem: OrdemDeServico): Promise<void>;
  findById(id: string): Promise<OrdemDeServico | null>;
  findAll(filters?: { empresaId?: string; status?: string }): Promise<OrdemDeServico[]>;
  nextNumero(ano: number): Promise<string>;
  findByCodigoBarras(codigo: string): Promise<LoteLocalizadoPorBarcode | null>;
}
