export class AdicionarOperacaoAReferenciaCommand {
  constructor(
    readonly modeloId: string,
    readonly referenciaId: string,
    readonly descricao: string,
    readonly tempo: number,
  ) {}
}
