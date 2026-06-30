import { Controller, All, Req, Res, Module, Get, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import {
  collectDefaultMetrics, Counter, Histogram, Registry,
} from 'prom-client';

const registry = new Registry();
registry.setDefaultLabels({ service: 'api-gateway' });
collectDefaultMetrics({ register: registry, prefix: 'nodejs_' });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route'] as const,
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

const UUID_RE = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const ULID_RE = /\/[0-9a-z]{26}/gi;
function normalizeRoute(path: string): string {
  return path.replace(UUID_RE, '/:id').replace(ULID_RE, '/:id');
}

function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
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

@Controller()
class ProxyController {
  private empresasProxy: ReturnType<typeof createProxyMiddleware>;
  private producaoProxy: ReturnType<typeof createProxyMiddleware>;

  constructor(config: ConfigService) {
    this.empresasProxy = createProxyMiddleware({
      target: config.getOrThrow('EMPRESAS_SERVICE_URL'),
      changeOrigin: true,
      on: { proxyReq: fixRequestBody },
    });

    this.producaoProxy = createProxyMiddleware({
      target: config.getOrThrow('PRODUCAO_SERVICE_URL'),
      changeOrigin: true,
      on: { proxyReq: fixRequestBody },
    });
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'api-gateway' };
  }

  @Get('metrics')
  async metrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  }

  @All('api/empresas*')
  proxyEmpresas(@Req() req: Request, @Res() res: Response) {
    this.empresasProxy(req, res, (err: Error) => { if (err) res.status(502).json({ error: 'Bad gateway' }); });
  }

  @All('api/producao*')
  proxyProducao(@Req() req: Request, @Res() res: Response) {
    this.producaoProxy(req, res, (err: Error) => { if (err) res.status(502).json({ error: 'Bad gateway' }); });
  }
}

@Module({ controllers: [ProxyController] })
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(httpMetricsMiddleware).forRoutes('*');
  }
}
