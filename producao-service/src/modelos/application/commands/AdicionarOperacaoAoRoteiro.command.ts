export class AdicionarOperacaoAoRoteiroCommand {
  constructor(
    readonly modeloId: string,
    readonly descricao: string,
    readonly tempo: number,
  ) {}
}
