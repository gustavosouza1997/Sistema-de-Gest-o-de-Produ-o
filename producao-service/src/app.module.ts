import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { ModelosModule } from './modelos/infrastructure/ModelosModule';
import { OrdensDeServicoModule } from './ordens-de-servico/infrastructure/OrdensDeServicoModule';
import { ControleDeProducaoModule } from './controle-de-producao/infrastructure/ControleDeProducaoModule';
import { MetricsModule } from './shared/metrics/MetricsModule';
import { EventStoreModule } from './shared/event-store/EventStoreModule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    LoggerModule.forRoot({
      pinoHttp: {
        customProps: () => ({ service: 'producao-service' }),
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty' }
          : undefined,
      },
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        database: config.get('DATABASE_NAME'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        autoLoadEntities: true,
        synchronize: config.get('TYPEORM_SYNC') === 'true',
      }),
    }),

    EventStoreModule,
    MetricsModule,
    ModelosModule,
    OrdensDeServicoModule,
    ControleDeProducaoModule,
  ],
})
export class AppModule {}
