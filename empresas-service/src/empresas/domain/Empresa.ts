import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { generateId } from '../../shared/domain/IdGenerator';
import { EmpresaCriada } from './events/EmpresaCriada';
import { EmpresaAtualizada } from './events/EmpresaAtualizada';
import { EmpresaDesativada } from './events/EmpresaDesativada';
import { EmpresaReativada } from './events/EmpresaReativada';

export type Crt = 1 | 2 | 3;

export interface EnderecoProps {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface CriarEmpresaProps {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  cnae?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  crt?: Crt;
  telefone?: string;
  email?: string;
  endereco?: EnderecoProps;
  observacoes?: string;
}

export interface EmpresaProps extends CriarEmpresaProps {
  id: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class Empresa extends AggregateRoot {
  readonly id: string;
  readonly razaoSocial: string;
  readonly nomeFantasia?: string;
  readonly cnpj: string;
  readonly cnae?: string;
  readonly inscricaoMunicipal?: string;
  readonly inscricaoEstadual?: string;
  readonly crt?: Crt;
  readonly telefone?: string;
  readonly email?: string;
  readonly endereco?: EnderecoProps;
  readonly observacoes?: string;
  readonly ativo: boolean;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;

  private constructor(props: EmpresaProps) {
    super();
    Object.assign(this, props);
  }

  static criar(props: CriarEmpresaProps): Empresa {
    const empresa = new Empresa({
      ...props,
      id: generateId(),
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    empresa.addEvent(new EmpresaCriada(empresa.id, empresa.razaoSocial, empresa.cnpj));
    return empresa;
  }

  static reconstituir(props: EmpresaProps): Empresa {
    return new Empresa(props);
  }

  atualizar(campos: Partial<CriarEmpresaProps>): Empresa {
    const updated = Empresa.reconstituir({ ...this.toProps(), ...campos, atualizadoEm: new Date() });
    updated.addEvent(new EmpresaAtualizada(this.id, campos));
    return updated;
  }

  desativar(): Empresa {
    if (!this.ativo) throw new Error('Empresa já está inativa');
    const updated = Empresa.reconstituir({ ...this.toProps(), ativo: false, atualizadoEm: new Date() });
    updated.addEvent(new EmpresaDesativada(this.id));
    return updated;
  }

  reativar(): Empresa {
    if (this.ativo) throw new Error('Empresa já está ativa');
    const updated = Empresa.reconstituir({ ...this.toProps(), ativo: true, atualizadoEm: new Date() });
    updated.addEvent(new EmpresaReativada(this.id));
    return updated;
  }

  toProps(): EmpresaProps {
    return {
      id: this.id,
      razaoSocial: this.razaoSocial,
      nomeFantasia: this.nomeFantasia,
      cnpj: this.cnpj,
      cnae: this.cnae,
      inscricaoMunicipal: this.inscricaoMunicipal,
      inscricaoEstadual: this.inscricaoEstadual,
      crt: this.crt,
      telefone: this.telefone,
      email: this.email,
      endereco: this.endereco,
      observacoes: this.observacoes,
      ativo: this.ativo,
      criadoEm: this.criadoEm,
      atualizadoEm: this.atualizadoEm,
    };
  }
}
