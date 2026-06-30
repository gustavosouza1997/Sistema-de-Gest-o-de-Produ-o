import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CriarEmpresaCommand } from '../../application/commands/CriarEmpresa.command';
import { AtualizarEmpresaCommand } from '../../application/commands/AtualizarEmpresa.command';
import { DesativarEmpresaCommand } from '../../application/commands/DesativarEmpresa.command';
import { ListarEmpresasQuery } from '../../application/queries/ListarEmpresas.query';
import { CriarEmpresaProps } from '../../domain/Empresa';
import { ReativarEmpresaCommand } from '../../application/commands/ReativarEmpresa.command';

class EnderecoDto {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

class CriarEmpresaDto {
  razaoSocial: string;
  cnpj: string;
  nomeFantasia?: string;
  cnae?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  crt?: 1 | 2 | 3;
  telefone?: string;
  email?: string;
  endereco?: EnderecoDto;
  observacoes?: string;
}

class AtualizarEmpresaDto implements Partial<CriarEmpresaProps> {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  cnae?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  crt?: 1 | 2 | 3;
  telefone?: string;
  email?: string;
  endereco?: EnderecoDto;
  observacoes?: string;
}

@Controller('empresas')
export class EmpresaController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  listar(@Query('ativo') ativo?: string) {
    return this.queryBus.execute(new ListarEmpresasQuery(ativo !== undefined ? ativo === 'true' : undefined));
  }

  @Post()
  criar(@Body() dto: CriarEmpresaDto) {
    return this.commandBus.execute(
      new CriarEmpresaCommand(
        dto.razaoSocial, dto.cnpj, dto.nomeFantasia, dto.cnae,
        dto.inscricaoMunicipal, dto.inscricaoEstadual, dto.crt,
        dto.telefone, dto.email, dto.endereco, dto.observacoes,
      ),
    );
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarEmpresaDto) {
    return this.commandBus.execute(new AtualizarEmpresaCommand(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  desativar(@Param('id') id: string) {
    return this.commandBus.execute(new DesativarEmpresaCommand(id));
  }

  @Patch(':id/reativar')
  @HttpCode(204)
  reativar(@Param('id') id: string) {
    return this.commandBus.execute(new ReativarEmpresaCommand(id));
  }
}
