import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriarModeloHandler } from '../application/commands/CriarModelo.handler';
import { AtualizarModeloHandler } from '../application/commands/AtualizarModelo.handler';
import { DesativarModeloHandler } from '../application/commands/DesativarModelo.handler';
import { ReativarModeloHandler } from '../application/commands/ReativarModelo.handler';
import { AdicionarOperacaoAoRoteiroHandler } from '../application/commands/AdicionarOperacaoAoRoteiro.handler';
import { EditarOperacaoDoRoteiroHandler } from '../application/commands/EditarOperacaoDoRoteiro.handler';
import { RemoverOperacaoDoRoteiroHandler } from '../application/commands/RemoverOperacaoDoRoteiro.handler';
import { AdicionarReferenciaHandler } from '../application/commands/AdicionarReferencia.handler';
import { EditarReferenciaHandler } from '../application/commands/EditarReferencia.handler';
import { RemoverReferenciaHandler } from '../application/commands/RemoverReferencia.handler';
import { AdicionarOperacaoAReferenciaHandler } from '../application/commands/AdicionarOperacaoAReferencia.handler';
import { EditarOperacaoDeReferenciaHandler } from '../application/commands/EditarOperacaoDeReferencia.handler';
import { RemoverOperacaoDeReferenciaHandler } from '../application/commands/RemoverOperacaoDeReferencia.handler';
import { ListarModelosHandler } from '../application/queries/ListarModelos.handler';
import { BuscarModeloHandler } from '../application/queries/BuscarModelo.handler';
import { MODELO_REPOSITORY } from '../domain/ModeloRepository.port';
import { ModeloEntity } from './persistence/ModeloEntity';
import { OperacaoEntity } from './persistence/OperacaoEntity';
import { ReferenciaEntity } from './persistence/ReferenciaEntity';
import { OperacaoAdicionalEntity } from './persistence/OperacaoAdicionalEntity';
import { ModeloTypeormRepository } from './persistence/ModeloTypeormRepository';
import { ModeloController } from './http/ModeloController';
import { EventStoreModule } from '../../shared/event-store/EventStoreModule';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ModeloEntity, OperacaoEntity, ReferenciaEntity, OperacaoAdicionalEntity]),
    EventStoreModule,
  ],
  controllers: [ModeloController],
  providers: [
    CriarModeloHandler,
    AtualizarModeloHandler,
    DesativarModeloHandler,
    ReativarModeloHandler,
    AdicionarOperacaoAoRoteiroHandler,
    EditarOperacaoDoRoteiroHandler,
    RemoverOperacaoDoRoteiroHandler,
    AdicionarReferenciaHandler,
    EditarReferenciaHandler,
    RemoverReferenciaHandler,
    AdicionarOperacaoAReferenciaHandler,
    EditarOperacaoDeReferenciaHandler,
    RemoverOperacaoDeReferenciaHandler,
    ListarModelosHandler,
    BuscarModeloHandler,
    { provide: MODELO_REPOSITORY, useClass: ModeloTypeormRepository },
  ],
})
export class ModelosModule {}
