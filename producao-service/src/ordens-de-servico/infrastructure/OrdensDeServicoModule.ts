import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriarOrdemHandler } from '../application/commands/CriarOrdem.handler';
import { AbrirOrdemHandler } from '../application/commands/AbrirOrdem.handler';
import { IniciarExecucaoOrdemHandler } from '../application/commands/IniciarExecucaoOrdem.handler';
import { ConcluirOrdemHandler } from '../application/commands/ConcluirOrdem.handler';
import { CancelarOrdemHandler } from '../application/commands/CancelarOrdem.handler';
import { AdicionarRemessaHandler } from '../application/commands/AdicionarRemessa.handler';
import { RemoverRemessaHandler } from '../application/commands/RemoverRemessa.handler';
import { AdicionarLoteHandler } from '../application/commands/AdicionarLote.handler';
import { EditarLoteHandler } from '../application/commands/EditarLote.handler';
import { RemoverLoteHandler } from '../application/commands/RemoverLote.handler';
import { AvancarEtapaLoteHandler } from '../application/commands/AvancarEtapaLote.handler';
import { AvancarPorBarcodeHandler } from '../application/commands/AvancarPorBarcode.handler';
import { ListarOrdensHandler } from '../application/queries/ListarOrdens.handler';
import { BuscarOrdemHandler } from '../application/queries/BuscarOrdem.handler';
import { ORDEM_REPOSITORY } from '../domain/OrdemRepository.port';
import { OrdemEntity } from './persistence/OrdemEntity';
import { RemessaEntity } from './persistence/RemessaEntity';
import { LoteEntity } from './persistence/LoteEntity';
import { OrdemTypeormRepository } from './persistence/OrdemTypeormRepository';
import { OrdemController } from './http/OrdemController';
import { LoteController } from './http/LoteController';
import { EventStoreModule } from '../../shared/event-store/EventStoreModule';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([OrdemEntity, RemessaEntity, LoteEntity]),
    EventStoreModule,
  ],
  controllers: [OrdemController, LoteController],
  providers: [
    CriarOrdemHandler,
    AbrirOrdemHandler,
    IniciarExecucaoOrdemHandler,
    ConcluirOrdemHandler,
    CancelarOrdemHandler,
    AdicionarRemessaHandler,
    RemoverRemessaHandler,
    AdicionarLoteHandler,
    EditarLoteHandler,
    RemoverLoteHandler,
    AvancarEtapaLoteHandler,
    AvancarPorBarcodeHandler,
    ListarOrdensHandler,
    BuscarOrdemHandler,
    { provide: ORDEM_REPOSITORY, useClass: OrdemTypeormRepository },
  ],
})
export class OrdensDeServicoModule {}
