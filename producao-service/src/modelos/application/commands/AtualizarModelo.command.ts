export class AtualizarModeloCommand {
  constructor(
    readonly id: string,
    readonly sigla: string,
    readonly linha: string,
    readonly preco: number,
    readonly producaoPorDia: number,
    readonly turno: number,
    readonly custoPorMinutoPrevisto: number,
  ) {}
}
