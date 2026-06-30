import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modelo } from '../../domain/Modelo';
import { Operacao } from '../../domain/Operacao';
import { Referencia } from '../../domain/Referencia';
import { ModeloRepository } from '../../domain/ModeloRepository.port';
import { ModeloEntity } from './ModeloEntity';
import { OperacaoEntity } from './OperacaoEntity';
import { ReferenciaEntity } from './ReferenciaEntity';
import { OperacaoAdicionalEntity } from './OperacaoAdicionalEntity';

@Injectable()
export class ModeloTypeormRepository implements ModeloRepository {
  constructor(
    @InjectRepository(ModeloEntity)
    private readonly repo: Repository<ModeloEntity>,
  ) {}

  async save(modelo: Modelo): Promise<void> {
    await this.repo.save(this.toEntity(modelo));
  }

  async findById(id: string): Promise<Modelo | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySigla(empresaId: string, sigla: string): Promise<Modelo | null> {
    const entity = await this.repo.findOne({ where: { empresaId, sigla } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(filters?: { empresaId?: string; ativo?: boolean }): Promise<Modelo[]> {
    const entities = await this.repo.findBy({
      ...(filters?.empresaId && { empresaId: filters.empresaId }),
      ...(filters?.ativo !== undefined && { ativo: filters.ativo }),
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(modelo: Modelo): ModeloEntity {
    const entity = new ModeloEntity();
    Object.assign(entity, {
      id: modelo.id, empresaId: modelo.empresaId, sigla: modelo.sigla, linha: modelo.linha,
      preco: modelo.preco, producaoPorDia: modelo.producaoPorDia, turno: modelo.turno,
      custoPorMinutoPrevisto: modelo.custoPorMinutoPrevisto, ativo: modelo.ativo,
    });

    entity.operacoes = modelo.roteiro.map((op) => {
      const e = new OperacaoEntity();
      Object.assign(e, { id: op.id, modeloId: modelo.id, descricao: op.descricao, tempo: op.tempo, ordem: op.ordem });
      return e;
    });

    entity.referencias = modelo.referencias.map((ref) => {
      const e = new ReferenciaEntity();
      Object.assign(e, { id: ref.id, modeloId: modelo.id, nome: ref.nome });
      e.operacoesAdicionais = ref.operacoesAdicionais.map((op) => {
        const oa = new OperacaoAdicionalEntity();
        Object.assign(oa, { id: op.id, referenciaId: ref.id, descricao: op.descricao, tempo: op.tempo, ordem: op.ordem });
        return oa;
      });
      return e;
    });

    return entity;
  }

  private toDomain(entity: ModeloEntity): Modelo {
    const roteiro = (entity.operacoes ?? [])
      .sort((a, b) => a.ordem - b.ordem)
      .map((op) => Operacao.reconstituir({ id: op.id, descricao: op.descricao, tempo: Number(op.tempo), ordem: op.ordem }));

    const referencias = (entity.referencias ?? []).map((ref) => {
      const opsAdicionais = (ref.operacoesAdicionais ?? [])
        .sort((a, b) => a.ordem - b.ordem)
        .map((op) => Operacao.reconstituir({ id: op.id, descricao: op.descricao, tempo: Number(op.tempo), ordem: op.ordem }));
      return Referencia.reconstituir({ id: ref.id, nome: ref.nome, operacoesAdicionais: opsAdicionais });
    });

    return Modelo.reconstituir({
      id: entity.id, empresaId: entity.empresaId, sigla: entity.sigla, linha: entity.linha,
      preco: Number(entity.preco), producaoPorDia: entity.producaoPorDia, turno: entity.turno,
      custoPorMinutoPrevisto: Number(entity.custoPorMinutoPrevisto),
      roteiro, referencias, ativo: entity.ativo, criadoEm: entity.criadoEm, atualizadoEm: entity.atualizadoEm,
    });
  }
}
