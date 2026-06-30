export class AdicionarLoteCommand {
  constructor(
    readonly ordemId: string,
    readonly remessaId: string,
    readonly identificador: string,
    readonly codigoBarras: string | undefined,
    readonly modeloId: string,
    readonly quantidade: number,
  ) {}
}
