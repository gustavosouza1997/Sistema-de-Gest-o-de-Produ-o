# Observabilidade

Stack implementada: **Prometheus 2.51 + Loki 3.0 + Grafana 10.4 + Promtail 3.0**

Acesso: **http://localhost:3003** (Grafana — anônimo com role Admin)

---

## Arquitetura da Stack

```
  Serviços Node.js
  (GET /metrics — fora do prefixo /api)
         │
         ├──► Prometheus (scrape a cada 15s)  ──► Grafana Dashboards
         │
         └──► Promtail (Docker socket)  ──► Loki 3.0 (tsdb v13)  ──► Grafana Logs
```

---

## Prometheus — Métricas

### Targets em funcionamento

| Job | Host | Status |
|-----|------|--------|
| `api-gateway` | `api-gateway:3000` | ✅ up |
| `producao-service` | `producao-service:3000` | ✅ up |
| `empresas-service` | `empresas-service:3000` | ✅ up |
| `prometheus` | `localhost:9090` | ✅ up |

### Métricas coletadas

**Node.js Runtime** (`collectDefaultMetrics` com prefixo `nodejs_`):
- `nodejs_heap_size_used_bytes` — heap usado
- `nodejs_eventloop_lag_seconds` — latência do event loop
- `nodejs_process_cpu_seconds_total` — CPU consumida
- `nodejs_gc_duration_seconds` — tempo de garbage collection

**HTTP** (middleware automático em todos os serviços):
- `http_requests_total{method, route, status_code}` — contador de requisições
- `http_request_duration_seconds{method, route}` — histograma de latência
  - Buckets: 5ms, 10ms, 50ms, 100ms, 300ms, 500ms, 1s, 2s, 5s

**CQRS**:
- `commands_total{command, status}` — commands executados por nome e resultado

**Event Sourcing**:
- `domain_events_total{event_type}` — eventos gravados no event store (contador em tempo real)

**Negócio** (Gauges com collect lazy — atualizados a cada scrape via query SQL):
- `ordens_por_status{status}` — OS atuais por status (rascunho, aberta, em_execucao...)
- `lotes_por_etapa{etapa}` — lotes atuais por etapa de fabricação
- `eventos_no_store{event_type}` — total de eventos persistidos por tipo

### Middleware HTTP (normalização de rotas)

UUIDs e ULIDs são substituídos por `:id` antes de virar label, evitando cardinalidade alta:
```
/api/producao/ordens/019f15d2-.../remessas/019f15d2-... → /api/producao/ordens/:id/remessas/:id
```

---

## Loki 3.0 — Logs

Schema atualizado para **tsdb v13** (recomendado para Loki 3.x).

### Coleta via Promtail

Promtail usa Docker service discovery — coleta logs de todos os containers do Compose automaticamente e adiciona labels `service` e `container`.

### Formato dos logs (Pino JSON estruturado)

```json
{
  "level": 30,
  "time": 1782778480000,
  "pid": 1,
  "hostname": "...",
  "service": "producao-service",
  "msg": "Ordem criada com sucesso",
  "req": { "method": "POST", "url": "/api/producao/ordens" },
  "res": { "statusCode": 201 }
}
```

### Queries Loki úteis

```logql
-- Erros de todos os serviços
{service=~"producao-service|empresas-service|api-gateway"} | json | level = "error"

-- Requisições lentas (> 1s)
{service="producao-service"} | json | responseTime > 1000

-- Eventos de domínio
{service="producao-service"} |= "domain_event"
```

---

## Grafana 10.4 — Dashboard Provisionado

Dashboard: **"Calçados Padilha — Visão Geral"** (`uid: calcados-padilha-overview`)
Acesso direto: `http://localhost:3003/d/calcados-padilha-overview`

### Painéis

| Seção | Painel |
|-------|--------|
| Saúde | Stat: serviços ativos (up/down) |
| HTTP | Time series: requests/s por serviço |
| HTTP | Stat: taxa de erro 5xx (últimos 5m) |
| Latência | Time series: p50/p95/p99 por serviço |
| Negócio | Pie chart: OS por status |
| Negócio | Bar chart: lotes por etapa de fabricação |
| Negócio | Time series: taxa de eventos de domínio |
| Event Store | Bar gauge: total de eventos por tipo |
| CQRS | Time series: commands por status |
| Runtime | Time series: heap usado por serviço |
| Runtime | Time series: event loop lag |
| Logs | Panel: erros recentes (Loki) |
| Logs | Panel: logs gerais recentes (Loki) |

O dashboard é provisionado automaticamente via arquivo JSON em `infra/grafana/provisioning/dashboards/overview.json`.

---

## Data Sources Provisionados

```yaml
# infra/grafana/provisioning/datasources/datasources.yml
- name: Prometheus  →  http://prometheus:9090  (default)
- name: Loki        →  http://loki:3100
```

---

Ver [[Tech Stack]] para versões exatas de cada componente.
