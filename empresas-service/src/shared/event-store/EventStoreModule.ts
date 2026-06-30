import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventStore } from './EventStore';
import { EventStoreEntity } from './EventStoreEntity';

@Module({
  imports: [TypeOrmModule.forFeature([EventStoreEntity])],
  providers: [EventStore],
  exports: [EventStore],
})
export class EventStoreModule {}
