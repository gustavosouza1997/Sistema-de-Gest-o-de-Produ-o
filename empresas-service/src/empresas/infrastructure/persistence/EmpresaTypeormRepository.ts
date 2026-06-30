import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa, EmpresaProps } from '../../domain/Empresa';
import { EmpresaRepository } from '../../domain/EmpresaRepository.port';
import { EmpresaEntity } from './EmpresaEntity';

@Injectable()
export class EmpresaTypeormRepository implements EmpresaRepository {
  constructor(@InjectRepository(EmpresaEntity) private readonly repo: Repository<EmpresaEntity>) {}

  async save(empresa: Empresa): Promise<void> {
    await this.repo.save({
      id: empresa.id,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
      cnae: empresa.cnae,
      inscricaoMunicipal: empresa.inscricaoMunicipal,
      inscricaoEstadual: empresa.inscricaoEstadual,
      crt: empresa.crt,
      telefone: empresa.telefone,
      email: empresa.email,
      cep: empresa.endereco?.cep,
      logradouro: empresa.endereco?.logradouro,
      numero: empresa.endereco?.numero,
      complemento: empresa.endereco?.complemento,
      bairro: empresa.endereco?.bairro,
      cidade: empresa.endereco?.cidade,
      uf: empresa.endereco?.uf,
      observacoes: empresa.observacoes,
      ativo: empresa.ativo,
    });
  }

  async findById(id: string): Promise<Empresa | null> {
    const e = await this.repo.findOneBy({ id });
    return e ? this.toDomain(e) : null;
  }

  async findByCnpj(cnpj: string): Promise<Empresa | null> {
    const e = await this.repo.findOneBy({ cnpj });
    return e ? this.toDomain(e) : null;
  }

  async findAll(filters?: { ativo?: boolean }): Promise<Empresa[]> {
    const entities = await this.repo.findBy({ ...(filters as any) });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(e: EmpresaEntity): Empresa {
    const props: EmpresaProps = {
      id: e.id,
      razaoSocial: e.razaoSocial,
      nomeFantasia: e.nomeFantasia,
      cnpj: e.cnpj,
      cnae: e.cnae,
      inscricaoMunicipal: e.inscricaoMunicipal,
      inscricaoEstadual: e.inscricaoEstadual,
      crt: e.crt as any,
      telefone: e.telefone,
      email: e.email,
      endereco: (e.cep || e.logradouro || e.cidade) ? {
        cep: e.cep, logradouro: e.logradouro, numero: e.numero,
        complemento: e.complemento, bairro: e.bairro, cidade: e.cidade, uf: e.uf,
      } : undefined,
      observacoes: e.observacoes,
      ativo: e.ativo,
      criadoEm: e.criadoEm,
      atualizadoEm: e.atualizadoEm,
    };
    return Empresa.reconstituir(props);
  }
}
