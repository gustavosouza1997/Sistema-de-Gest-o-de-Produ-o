import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthMiddleware } from './auth/auth.middleware';
import { ProxyModule } from './proxy/proxy.module';
import { LoginController } from './auth/login.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: () => ({ service: 'api-gateway' }),
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    ProxyModule,
  ],
  controllers: [LoginController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'health',         method: RequestMethod.GET  },
        { path: 'metrics',        method: RequestMethod.GET  },
        { path: 'api/auth/login', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
