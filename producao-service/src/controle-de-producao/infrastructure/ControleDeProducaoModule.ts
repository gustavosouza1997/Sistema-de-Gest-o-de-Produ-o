import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControleEntity } from './persistence/ControleEntity';
import { EtapaEntity } from './persistence/EtapaEntity';
import { ControleController } from './http/ControleController';
import { EventStoreModule } from '../../shared/event-store/EventStoreModule';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([ControleEntity, EtapaEntity]), EventStoreModule],
  controllers: [ControleController],
  providers: [],
})
export class ControleDeProducaoModule {}
