import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListarEmpresasQuery } from './ListarEmpresas.query';
import { EMPRESA_REPOSITORY, EmpresaRepository } from '../../domain/EmpresaRepository.port';
import { Empresa } from '../../domain/Empresa';

@QueryHandler(ListarEmpresasQuery)
export class ListarEmpresasHandler implements IQueryHandler<ListarEmpresasQuery, Empresa[]> {
  constructor(@Inject(EMPRESA_REPOSITORY) private readonly empresaRepo: EmpresaRepository) {}
  execute(query: ListarEmpresasQuery): Promise<Empresa[]> {
    return this.empresaRepo.findAll({ ativo: query.ativo });
  }
}
