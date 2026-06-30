# Tech Stack

Tecnologias **efetivamente em uso** no projeto (não planejadas, implementadas).

---

## Frontend

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Framework | React | 18 |
| Build tool | Vite | — |
| UI Components | shadcn/ui + Radix UI | — |
| Estilização | Tailwind CSS | v3 |
| Linguagem | TypeScript | — |
| Estado do servidor | TanStack Query (React Query) | v5 |
| Estado local | Zustand | — |
| Formulários | react-hook-form | v7 |
| Validação de schema | Zod | — |
| Roteamento | React Router | v6 |
| HTTP Client | Fetch (nativo) | — |

---

## Backend

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Linguagem | TypeScript | ~5.4 |
| Runtime | Node.js | 22 (Alpine) |
| Framework HTTP | **NestJS** | 10 |
| Package manager | pnpm (workspaces) | — |
| ORM | TypeORM | 0.3.x |
| Banco de dados | PostgreSQL | 16 |
| Validação | class-validator + class-transformer | — |
| Logging | nestjs-pino + pino | — |
| CQRS | @nestjs/cqrs (CommandBus, QueryBus) | — |
| Message Broker | RabbitMQ (infraestrutura, consumers pendentes) | — |
| Autenticação | JWT via Authentik OIDC (JWKS validation) | — |

---

## Event Sourcing & DDD

| Conceito | Implementação |
|----------|--------------|
| Aggregate Root | `shared/domain/AggregateRoot.ts` (addEvent / pullEvents) |
| Domain Events | Classes TypeScript com `eventType`, `occurredAt`, `aggregateId` |
| Event Store | PostgreSQL tabela `events` (streamId, payload JSONB, version) |
| Projeções | Tabelas relacionais atualizadas sincronamente no `save()` |
| Reconstrução | `OrdemDeServico.reconstituirDeEventos(events[])` |

---

## Observabilidade

| Ferramenta | Versão | Função |
|------------|--------|--------|
| Prometheus | 2.51.0 | Scrape de métricas (15s interval) |
| Grafana | 10.4.0 | Dashboards + logs |
| Loki | 3.0.0 | Agregação de logs (schema tsdb v13) |
| Promtail | 3.0.0 | Coleta logs via Docker socket |
| prom-client | 15.x | SDK de métricas nos serviços Node.js |

---

## Infraestrutura

| Item | Tecnologia |
|------|------------|
| Containerização | Docker |
| Orquestração local | Docker Compose |
| Identity Provider | Authentik (self-hosted) |
| Proxy reverso / API Gateway | NestJS + http-proxy-middleware |

---

## Decisões Técnicas

Ver [[Decisões Técnicas]] e os [[ADRs/ADR-001 — Microserviços|ADRs]] para os motivos de cada escolha.
