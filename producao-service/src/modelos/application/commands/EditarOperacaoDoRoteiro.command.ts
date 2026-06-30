export class EditarOperacaoDoRoteiroCommand {
  constructor(
    readonly modeloId: string,
    readonly operacaoId: string,
    readonly descricao: string,
    readonly tempo: number,
  ) {}
}
