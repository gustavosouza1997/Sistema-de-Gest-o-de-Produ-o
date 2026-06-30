import { CriarEmpresaProps } from '../../domain/Empresa';

export class AtualizarEmpresaCommand {
  constructor(
    readonly id: string,
    readonly campos: Partial<CriarEmpresaProps>,
  ) {}
}
