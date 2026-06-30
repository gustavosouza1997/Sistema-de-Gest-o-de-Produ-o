import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriarEmpresaHandler } from '../application/commands/CriarEmpresa.handler';
import { AtualizarEmpresaHandler } from '../application/commands/AtualizarEmpresa.handler';
import { DesativarEmpresaHandler } from '../application/commands/DesativarEmpresa.handler';
import { ReativarEmpresaHandler } from '../application/commands/ReativarEmpresa.handler';
import { ListarEmpresasHandler } from '../application/queries/ListarEmpresas.handler';
import { EMPRESA_REPOSITORY } from '../domain/EmpresaRepository.port';
import { EmpresaEntity } from './persistence/EmpresaEntity';
import { EmpresaTypeormRepository } from './persistence/EmpresaTypeormRepository';
import { EmpresaController } from './http/EmpresaController';
import { EventStoreModule } from '../../shared/event-store/EventStoreModule';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([EmpresaEntity]), EventStoreModule],
  controllers: [EmpresaController],
  providers: [
    CriarEmpresaHandler,
    AtualizarEmpresaHandler,
    DesativarEmpresaHandler,
    ReativarEmpresaHandler,
    ListarEmpresasHandler,
    { provide: EMPRESA_REPOSITORY, useClass: EmpresaTypeormRepository },
  ],
})
export class EmpresasModule {}
