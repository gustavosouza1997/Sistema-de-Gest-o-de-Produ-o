export class CriarModeloCommand {
  constructor(
    readonly empresaId: string,
    readonly sigla: string,
    readonly linha: string,
    readonly preco: number,
    readonly producaoPorDia: number,
    readonly turno: number,
    readonly custoPorMinutoPrevisto: number,
  ) {}
}
