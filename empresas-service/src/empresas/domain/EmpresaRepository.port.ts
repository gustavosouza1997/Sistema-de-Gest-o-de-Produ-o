import { Empresa } from './Empresa';

export const EMPRESA_REPOSITORY = Symbol('EmpresaRepository');

export interface EmpresaRepository {
  save(empresa: Empresa): Promise<void>;
  findById(id: string): Promise<Empresa | null>;
  findByCnpj(cnpj: string): Promise<Empresa | null>;
  findAll(filters?: { ativo?: boolean }): Promise<Empresa[]>;
}
