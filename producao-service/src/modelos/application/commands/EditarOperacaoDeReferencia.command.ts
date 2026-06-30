export class EditarOperacaoDeReferenciaCommand {
  constructor(
    readonly modeloId: string,
    readonly referenciaId: string,
    readonly operacaoId: string,
    readonly descricao: string,
    readonly tempo: number,
  ) {}
}
