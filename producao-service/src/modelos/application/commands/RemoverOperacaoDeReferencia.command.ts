export class RemoverOperacaoDeReferenciaCommand {
  constructor(
    readonly modeloId: string,
    readonly referenciaId: string,
    readonly operacaoId: string,
  ) {}
}
