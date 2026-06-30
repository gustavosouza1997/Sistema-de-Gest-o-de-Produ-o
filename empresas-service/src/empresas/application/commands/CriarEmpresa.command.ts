import { CriarEmpresaProps } from '../../domain/Empresa';

export class CriarEmpresaCommand implements CriarEmpresaProps {
  constructor(
    readonly razaoSocial: string,
    readonly cnpj: string,
    readonly nomeFantasia?: string,
    readonly cnae?: string,
    readonly inscricaoMunicipal?: string,
    readonly inscricaoEstadual?: string,
    readonly crt?: 1 | 2 | 3,
    readonly telefone?: string,
    readonly email?: string,
    readonly endereco?: CriarEmpresaProps['endereco'],
    readonly observacoes?: string,
  ) {}
}
