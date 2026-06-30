import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

class ConcluirEtapaDto {
  operadorId: string;
  observacao?: string;
}

@Controller('producao/controles')
export class ControleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':ordemId')
  buscarPorOrdem(@Param('ordemId') ordemId: string) {
    // TODO: implementar BuscarControlePorOrdemQuery
    return null;
  }

  @Patch(':id/etapas/:etapaId/concluir')
  concluirEtapa(
    @Param('id') id: string,
    @Param('etapaId') etapaId: string,
    @Body() dto: ConcluirEtapaDto,
  ) {
    // TODO: implementar ConcluirEtapaCommand
    return null;
  }
}
