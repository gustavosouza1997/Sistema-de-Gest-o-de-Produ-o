import { Controller, Get, MiddlewareConsumer, Module, NestModule, Res } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export const metricsRegistry = new Registry();
metricsRegistry.setDefaultLabels({ service: 'empresas-service' });

collectDefaultMetrics({ register: metricsRegistry, prefix: 'nodejs_' });

export const commandsTotal = new Counter({
  name: 'commands_total',
  help: 'Total de commands executados',
  labelNames: ['command', 'status'] as const,
  registers: [metricsRegistry],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route'] as const,
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

const UUID_RE = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const ULID_RE = /\/[0-9a-z]{26}/gi;
function normalizeRoute(path: string): string {
  return path.replace(UUID_RE, '/:id').replace(ULID_RE, '/:id');
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

@Controller('metrics')
class MetricsController {
  @Get()
  async getMetrics(@Res() res: any): Promise<void> {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  }
}

@Module({ controllers: [MetricsController] })
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(httpMetricsMiddleware).forRoutes('*');
  }
}
