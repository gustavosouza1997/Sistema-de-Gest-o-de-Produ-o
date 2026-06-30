import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CriarModeloCommand } from '../../application/commands/CriarModelo.command';
import { AtualizarModeloCommand } from '../../application/commands/AtualizarModelo.command';
import { DesativarModeloCommand } from '../../application/commands/DesativarModelo.command';
import { ReativarModeloCommand } from '../../application/commands/ReativarModelo.command';
import { AdicionarOperacaoAoRoteiroCommand } from '../../application/commands/AdicionarOperacaoAoRoteiro.command';
import { EditarOperacaoDoRoteiroCommand } from '../../application/commands/EditarOperacaoDoRoteiro.command';
import { RemoverOperacaoDoRoteiroCommand } from '../../application/commands/RemoverOperacaoDoRoteiro.command';
import { AdicionarReferenciaCommand } from '../../application/commands/AdicionarReferencia.command';
import { EditarReferenciaCommand } from '../../application/commands/EditarReferencia.command';
import { RemoverReferenciaCommand } from '../../application/commands/RemoverReferencia.command';
import { AdicionarOperacaoAReferenciaCommand } from '../../application/commands/AdicionarOperacaoAReferencia.command';
import { EditarOperacaoDeReferenciaCommand } from '../../application/commands/EditarOperacaoDeReferencia.command';
import { RemoverOperacaoDeReferenciaCommand } from '../../application/commands/RemoverOperacaoDeReferencia.command';
import { ListarModelosQuery } from '../../application/queries/ListarModelos.query';
import { BuscarModeloQuery } from '../../application/queries/BuscarModelo.query';

class CriarModeloDto {
  empresaId: string;
  sigla: string;
  linha: string;
  preco: number;
  producaoPorDia: number;
  turno: number;
  custoPorMinutoPrevisto: number;
}

class AtualizarModeloDto {
  sigla: string;
  linha: string;
  preco: number;
  producaoPorDia: number;
  turno: number;
  custoPorMinutoPrevisto: number;
}

class AdicionarOperacaoDto {
  descricao: string;
  tempo: number;
}

class AdicionarReferenciaDto {
  nome: string;
}

@Controller('producao/modelos')
export class ModeloController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  listar(@Query('empresaId') empresaId?: string, @Query('ativo') ativo?: string) {
    return this.queryBus.execute(new ListarModelosQuery(empresaId, ativo !== undefined ? ativo === 'true' : undefined));
  }

  @Post()
  criar(@Body() dto: CriarModeloDto) {
    return this.commandBus.execute(
      new CriarModeloCommand(dto.empresaId, dto.sigla, dto.linha, dto.preco, dto.producaoPorDia, dto.turno, dto.custoPorMinutoPrevisto),
    );
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.queryBus.execute(new BuscarModeloQuery(id));
  }

  @Patch(':id')
  @HttpCode(204)
  atualizar(@Param('id') id: string, @Body() dto: AtualizarModeloDto) {
    return this.commandBus.execute(
      new AtualizarModeloCommand(id, dto.sigla, dto.linha, dto.preco, dto.producaoPorDia, dto.turno, dto.custoPorMinutoPrevisto),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  desativar(@Param('id') id: string) {
    return this.commandBus.execute(new DesativarModeloCommand(id));
  }

  @Patch(':id/reativar')
  @HttpCode(204)
  reativar(@Param('id') id: string) {
    return this.commandBus.execute(new ReativarModeloCommand(id));
  }

  // ── Roteiro ─────────────────────────────────────────────────────────────────
  @Post(':id/roteiro')
  adicionarOperacao(@Param('id') id: string, @Body() dto: AdicionarOperacaoDto) {
    return this.commandBus.execute(new AdicionarOperacaoAoRoteiroCommand(id, dto.descricao, dto.tempo));
  }

  @Patch(':id/roteiro/:opId')
  @HttpCode(204)
  editarOperacaoDoRoteiro(@Param('id') id: string, @Param('opId') opId: string, @Body() dto: AdicionarOperacaoDto) {
    return this.commandBus.execute(new EditarOperacaoDoRoteiroCommand(id, opId, dto.descricao, dto.tempo));
  }

  @Delete(':id/roteiro/:opId')
  @HttpCode(204)
  removerOperacaoDoRoteiro(@Param('id') id: string, @Param('opId') opId: string) {
    return this.commandBus.execute(new RemoverOperacaoDoRoteiroCommand(id, opId));
  }

  // ── Referências ──────────────────────────────────────────────────────────────
  @Post(':id/referencias')
  adicionarReferencia(@Param('id') id: string, @Body() dto: AdicionarReferenciaDto) {
    return this.commandBus.execute(new AdicionarReferenciaCommand(id, dto.nome));
  }

  @Patch(':id/referencias/:refId')
  @HttpCode(204)
  editarReferencia(@Param('id') id: string, @Param('refId') refId: string, @Body() dto: AdicionarReferenciaDto) {
    return this.commandBus.execute(new EditarReferenciaCommand(id, refId, dto.nome));
  }

  @Delete(':id/referencias/:refId')
  @HttpCode(204)
  removerReferencia(@Param('id') id: string, @Param('refId') refId: string) {
    return this.commandBus.execute(new RemoverReferenciaCommand(id, refId));
  }

  // ── Operações de referência ──────────────────────────────────────────────────
  @Post(':id/referencias/:refId/operacoes')
  adicionarOperacaoAReferencia(
    @Param('id') id: string,
    @Param('refId') refId: string,
    @Body() dto: AdicionarOperacaoDto,
  ) {
    return this.commandBus.execute(new AdicionarOperacaoAReferenciaCommand(id, refId, dto.descricao, dto.tempo));
  }

  @Patch(':id/referencias/:refId/operacoes/:opId')
  @HttpCode(204)
  editarOperacaoDeReferencia(
    @Param('id') id: string,
    @Param('refId') refId: string,
    @Param('opId') opId: string,
    @Body() dto: AdicionarOperacaoDto,
  ) {
    return this.commandBus.execute(new EditarOperacaoDeReferenciaCommand(id, refId, opId, dto.descricao, dto.tempo));
  }

  @Delete(':id/referencias/:refId/operacoes/:opId')
  @HttpCode(204)
  removerOperacaoDeReferencia(
    @Param('id') id: string,
    @Param('refId') refId: string,
    @Param('opId') opId: string,
  ) {
    return this.commandBus.execute(new RemoverOperacaoDeReferenciaCommand(id, refId, opId));
  }
}
