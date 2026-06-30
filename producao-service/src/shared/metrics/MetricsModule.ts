import { Controller, Get, MiddlewareConsumer, Module, NestModule, OnModuleInit, Res } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Gauge } from 'prom-client';
import { metricsRegistry, httpRequestsTotal, httpRequestDuration, normalizeRoute } from './metrics';

@Controller('metrics')
class MetricsController {
  @Get()
  async getMetrics(@Res() res: any): Promise<void> {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function httpMetricsMiddleware(req: any, res: any, next: any): void {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    if (req.path === '/metrics') return;
    const route = normalizeRoute(req.path);
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestsTotal.inc({ method: req.method, route, status_code: String(res.statusCode) });
    httpRequestDuration.observe({ method: req.method, route }, duration);
  });
  next();
}

class MetricsCollectorService implements OnModuleInit {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  onModuleInit(): void {
    const db = this.db;

    new Gauge({
      name: 'ordens_por_status',
      help: 'Ordens de serviço agrupadas por status',
      labelNames: ['status'],
      registers: [metricsRegistry],
      async collect() {
        this.reset();
        const rows: { status: string; count: number }[] = await db.query(
          'SELECT status, COUNT(*)::int AS count FROM ordens_de_servico GROUP BY status',
        );
        for (const row of rows) this.set({ status: row.status }, row.count);
      },
    });

    new Gauge({
      name: 'lotes_por_etapa',
      help: 'Lotes agrupados por etapa de fabricação',
      labelNames: ['etapa'],
      registers: [metricsRegistry],
      async collect() {
        this.reset();
        const rows: { etapa: string; count: number }[] = await db.query(
          'SELECT etapa, COUNT(*)::int AS count FROM lotes GROUP BY etapa',
        );
        for (const row of rows) this.set({ etapa: row.etapa }, row.count);
      },
    });

    new Gauge({
      name: 'eventos_no_store',
      help: 'Total de eventos no event store por tipo',
      labelNames: ['event_type'],
      registers: [metricsRegistry],
      async collect() {
        this.reset();
        const rows: { event_type: string; count: number }[] = await db.query(
          'SELECT event_type, COUNT(*)::int AS count FROM events GROUP BY event_type',
        );
        for (const row of rows) this.set({ event_type: row.event_type }, row.count);
      },
    });
  }
}

@Module({
  providers: [MetricsCollectorService],
  controllers: [MetricsController],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(httpMetricsMiddleware).forRoutes('*');
  }
}
