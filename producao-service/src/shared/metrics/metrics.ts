import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

export const metricsRegistry = new Registry();
metricsRegistry.setDefaultLabels({ service: 'producao-service' });

collectDefaultMetrics({ register: metricsRegistry, prefix: 'nodejs_' });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route'] as const,
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export const commandsTotal = new Counter({
  name: 'commands_total',
  help: 'Total de commands executados',
  labelNames: ['command', 'status'] as const,
  registers: [metricsRegistry],
});

export const domainEventsTotal = new Counter({
  name: 'domain_events_total',
  help: 'Total de eventos de domínio gravados no event store',
  labelNames: ['event_type'] as const,
  registers: [metricsRegistry],
});

export const ordensGauge = new Gauge({
  name: 'ordens_total',
  help: 'Quantidade atual de ordens de serviço por status',
  labelNames: ['status'] as const,
  registers: [metricsRegistry],
});

export const lotesPorEtapaGauge = new Gauge({
  name: 'lotes_por_etapa_total',
  help: 'Quantidade atual de lotes por etapa de fabricação',
  labelNames: ['etapa'] as const,
  registers: [metricsRegistry],
});

const UUID_RE = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const ULID_RE = /\/[0-9a-z]{26}/gi;

export function normalizeRoute(path: string): string {
  return path.replace(UUID_RE, '/:id').replace(ULID_RE, '/:id');
}
