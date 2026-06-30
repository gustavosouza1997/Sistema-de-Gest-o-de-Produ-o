import { Modelo } from './Modelo';

export const MODELO_REPOSITORY = Symbol('ModeloRepository');

export interface ModeloRepository {
  save(modelo: Modelo): Promise<void>;
  findById(id: string): Promise<Modelo | null>;
  findBySigla(empresaId: string, sigla: string): Promise<Modelo | null>;
  findAll(filters?: { empresaId?: string; ativo?: boolean }): Promise<Modelo[]>;
}
