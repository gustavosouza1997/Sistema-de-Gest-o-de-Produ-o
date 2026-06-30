import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { EmpresasModule } from './empresas/infrastructure/EmpresasModule';
import { MetricsModule } from './shared/metrics/MetricsModule';
import { EventStoreModule } from './shared/event-store/EventStoreModule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: () => ({ service: 'empresas-service' }),
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
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
    EmpresasModule,
  ],
})
export class AppModule {}
