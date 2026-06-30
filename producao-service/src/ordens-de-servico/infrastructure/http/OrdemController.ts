import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CriarOrdemCommand } from '../../application/commands/CriarOrdem.command';
import { AbrirOrdemCommand } from '../../application/commands/AbrirOrdem.command';
import { IniciarExecucaoOrdemCommand } from '../../application/commands/IniciarExecucaoOrdem.command';
import { ConcluirOrdemCommand } from '../../application/commands/ConcluirOrdem.command';
import { CancelarOrdemCommand } from '../../application/commands/CancelarOrdem.command';
import { AdicionarRemessaCommand } from '../../application/commands/AdicionarRemessa.command';
import { RemoverRemessaCommand } from '../../application/commands/RemoverRemessa.command';
import { AdicionarLoteCommand } from '../../application/commands/AdicionarLote.command';
import { EditarLoteCommand } from '../../application/commands/EditarLote.command';
import { RemoverLoteCommand } from '../../application/commands/RemoverLote.command';
import { AvancarEtapaLoteCommand } from '../../application/commands/AvancarEtapaLote.command';
import { ListarOrdensQuery } from '../../application/queries/ListarOrdens.query';
import { BuscarOrdemQuery } from '../../application/queries/BuscarOrdem.query';

class CriarOrdemDto { empresaId: string; notaFiscalOrigem: string; }
class AdicionarRemessaDto { nome: string; }
class LoteDto { identificador: string; codigoBarras?: string; modeloId: string; quantidade: number; }

@Controller('producao/ordens')
export class OrdemController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  criar(@Body() dto: CriarOrdemDto) {
    return this.commandBus.execute(new CriarOrdemCommand(dto.empresaId, dto.notaFiscalOrigem));
  }

  @Get()
  listar(@Query('empresaId') empresaId?: string, @Query('status') status?: string) {
    return this.queryBus.execute(new ListarOrdensQuery(empresaId, status));
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.queryBus.execute(new BuscarOrdemQuery(id));
  }

  // ── status ─────────────────────────────────────────────────────────────────
  @Patch(':id/abrir')    @HttpCode(204) abrir   (@Param('id') id: string) { return this.commandBus.execute(new AbrirOrdemCommand(id)); }
  @Patch(':id/iniciar')  @HttpCode(204) iniciar  (@Param('id') id: string) { return this.commandBus.execute(new IniciarExecucaoOrdemCommand(id)); }
  @Patch(':id/concluir') @HttpCode(204) concluir (@Param('id') id: string) { return this.commandBus.execute(new ConcluirOrdemCommand(id)); }
  @Patch(':id/cancelar') @HttpCode(204) cancelar (@Param('id') id: string) { return this.commandBus.execute(new CancelarOrdemCommand(id)); }

  // ── remessas ────────────────────────────────────────────────────────────────
  @Post(':id/remessas')
  adicionarRemessa(@Param('id') id: string, @Body() dto: AdicionarRemessaDto) {
    return this.commandBus.execute(new AdicionarRemessaCommand(id, dto.nome));
  }

  @Delete(':id/remessas/:remessaId')
  @HttpCode(204)
  removerRemessa(@Param('id') id: string, @Param('remessaId') remessaId: string) {
    return this.commandBus.execute(new RemoverRemessaCommand(id, remessaId));
  }

  // ── lotes ───────────────────────────────────────────────────────────────────
  @Post(':id/remessas/:remessaId/lotes')
  adicionarLote(@Param('id') id: string, @Param('remessaId') remessaId: string, @Body() dto: LoteDto) {
    return this.commandBus.execute(new AdicionarLoteCommand(id, remessaId, dto.identificador, dto.codigoBarras, dto.modeloId, dto.quantidade));
  }

  @Patch(':id/remessas/:remessaId/lotes/:loteId')
  @HttpCode(204)
  editarLote(
    @Param('id') id: string, @Param('remessaId') remessaId: string, @Param('loteId') loteId: string, @Body() dto: LoteDto,
  ) {
    return this.commandBus.execute(new EditarLoteCommand(id, remessaId, loteId, dto.identificador, dto.codigoBarras, dto.modeloId, dto.quantidade));
  }

  @Delete(':id/remessas/:remessaId/lotes/:loteId')
  @HttpCode(204)
  removerLote(@Param('id') id: string, @Param('remessaId') remessaId: string, @Param('loteId') loteId: string) {
    return this.commandBus.execute(new RemoverLoteCommand(id, remessaId, loteId));
  }

  @Patch(':id/remessas/:remessaId/lotes/:loteId/avancar')
  @HttpCode(204)
  avancarEtapaLote(@Param('id') id: string, @Param('remessaId') remessaId: string, @Param('loteId') loteId: string) {
    return this.commandBus.execute(new AvancarEtapaLoteCommand(id, remessaId, loteId));
  }
}
