# Calçados Padilha — Sistema de Gestão de Produção

Sistema web full-stack desenvolvido para gestão de produção de calçados, aplicando as principais práticas e padrões da engenharia de software moderna.

---

## O que o sistema faz

### Gestão de Empresas
Cadastro de empresas clientes com nome, CNPJ, telefone e e-mail. Suporte a desativação (soft delete).

### Catálogo de Modelos
Cadastro de modelos de calçados com referências (tamanho/cor) e roteiro de produção (sequência de operações). Cada empresa tem seus próprios modelos.

### Ordens de Serviço
Uma OS vincula uma empresa a uma nota fiscal de origem e organiza a produção em:
- **Remessas** — grupos de lotes de uma mesma entrada de material
- **Lotes** — unidade rastreável com código de barras, quantidade de pares e etapa de fabricação atual

Ciclo de vida: `Rascunho → Aberta → Em Execução → Concluída` (ou Cancelada).

### Controle de Produção por Etapas
Kanban em tela cheia com 4 colunas mostrando todos os lotes ativos:

| Preparo | Costura | Revisão/Conserto | Entregue |
|---------|---------|-----------------|---------|

O operador aponta o **leitor de código de barras** no lote físico — o sistema avança a etapa automaticamente, sem nenhum clique.

---

## Arquitetura

### Microserviços com bancos isolados

```
Browser (React + Vite)
        │
        ▼
  api-gateway :3000   ←── valida JWT (Authentik OIDC)
   ├──► producao-service :3001 ←── PostgreSQL producao_db
   └──► empresas-service :3002 ←── PostgreSQL empresas_db

Observabilidade:
  Prometheus :9090 ◄── scrape /metrics (todos os serviços)
  Loki :3100 ◄── Promtail ◄── Docker logs
  Grafana :3003 ◄── Prometheus + Loki → Dashboard automático
```

Cada serviço tem seu próprio banco de dados. Nenhum serviço acessa o banco do outro.

### Arquitetura Hexagonal + Screaming Architecture

O código é organizado por **domínio** (não por camada técnica):
```
ordens-de-servico/
├── domain/          ← entidades, agregados, eventos
├── application/     ← commands, queries, handlers
└── infrastructure/  ← TypeORM, HTTP controllers
```

### CQRS (Command Query Responsibility Segregation)

**Escrita** (commands): `CriarOrdem`, `AbrirOrdem`, `AdicionarLote`, `AvancarEtapaLote`, `AvancarPorBarcode`, etc. — cada um com seu handler dedicado.

**Leitura** (queries): `ListarOrdens`, `BuscarOrdem` — queries SQL otimizadas nas tabelas de projeção.

### Event Sourcing Verdadeiro

O **estado dos agregados é reconstruído por replay de eventos**, não lido de uma tabela de estado:

```
1. Handler chama repo.findById(id)
2. EventStore busca todos os eventos do stream "ordem-{id}"
3. OrdemDeServico.reconstituirDeEventos(eventos) → reconstrói o estado atual
4. Handler aplica operação → novo evento emitido
5. repo.save(ordem) → appenda evento no event store + atualiza projeção SQL
```

Os 11 eventos de domínio: `OrdemCriada`, `OrdemAberta`, `OrdemEmExecucao`, `OrdemConcluida`, `OrdemCancelada`, `RemessaAdicionada`, `RemessaRemovida`, `LoteAdicionado`, `LoteEditado`, `LoteRemovido`, `EtapaLoteAvancada`.

**Por que Event Sourcing?** Auditoria completa — toda ação é gravada com quem fez, quando e o que mudou. Possibilidade de reconstruir o estado em qualquer ponto no tempo.

---

## Tecnologias Utilizadas

### Backend
| Camada          | Tecnologia                             |
| --------------- | -------------------------------------- |
| Framework       | **NestJS** (TypeScript)                |
| ORM             | **TypeORM** + PostgreSQL               |
| CQRS            | `@nestjs/cqrs` (CommandBus + QueryBus) |
| Logging         | **Pino** (JSON estruturado)            |
| Package manager | **pnpm** (monorepo workspaces)         |
| Autenticação    | **Authentik** (IdP OIDC self-hosted)   |
| Containers      | **Docker Compose**                     |

### Frontend
| Camada          | Tecnologia                              |
| --------------- | --------------------------------------- |
| Framework       | **React** + Vite                        |
| UI              | **shadcn/ui** + Radix UI + Tailwind CSS |
| Estado servidor | **TanStack Query** (React Query v5)     |
| Formulários     | react-hook-form + Zod                   |
| Roteamento      | React Router v6                         |

### Observabilidade (PLG Stack)
| Ferramenta | Função |
|------------|--------|
| **Prometheus** | Coleta métricas de todos os serviços (scrape a cada 15s) |
| **Loki 3.0** | Agrega logs dos containers (tsdb v13) |
| **Grafana 10.4** | Dashboard unificado, provisionado automaticamente |
| **prom-client** | SDK de métricas nos serviços Node.js |

---

## Métricas Observadas

### Infraestrutura
- `up{job}` — saúde de cada serviço
- `nodejs_heap_size_used_bytes` — memória heap por serviço
- `nodejs_eventloop_lag_seconds` — latência do event loop
- `nodejs_gc_duration_seconds` — tempo de garbage collection

### HTTP
- `http_requests_total{method, route, status_code}` — volume de requisições
- `http_request_duration_seconds{method, route}` — histograma de latência (p50/p95/p99)

### Negócio (atualizadas a cada scrape via query SQL)
- `ordens_por_status{status}` — OS ativas por status
- `lotes_por_etapa{etapa}` — lotes na fila de produção
- `eventos_no_store{event_type}` — total de eventos gravados

### CQRS / Event Sourcing
- `commands_total{command, status}` — commands executados com sucesso ou falha
- `domain_events_total{event_type}` — eventos emitidos em tempo real

---

## Dashboard Grafana

Dashboard **"Calçados Padilha — Visão Geral"** provisionado automaticamente (sem setup manual):

- Saúde dos 3 serviços (UP/DOWN com semáforo colorido)
- Requisições por segundo por serviço (time series)
- Taxa de erros 5xx nos últimos 5 minutos
- Latência p50/p95/p99 por serviço
- Pizza: OS por status | Bar: lotes por etapa de fabricação
- Bar gauge: eventos acumulados no event store por tipo
- Taxa de eventos de domínio em tempo real
- Commands executados por status (sucesso/falha)
- Heap e event loop lag dos 3 serviços Node.js
- Painel de erros recentes (via Loki)
- Painel de logs gerais recentes (via Loki)

---

## Como executar

```bash
# Clonar e iniciar
cd Code
docker compose up -d

# Acessar
Frontend:   http://localhost:5173
API:        http://localhost:3000/api
Grafana:    http://localhost:3003   (admin / admin)
Prometheus: http://localhost:9090
RabbitMQ:   http://localhost:15672  (guest / guest)
Authentik:  http://localhost:9000
```

---

## Padrões e Práticas Aplicadas

| Padrão | Implementação |
|--------|--------------|
| **DDD** (Domain-Driven Design) | Agregados, Value Objects, Domain Events |
| **Event Sourcing** | Agregados reconstruídos por replay de eventos |
| **CQRS** | CommandBus / QueryBus separados; projeções SQL para leitura |
| **Hexagonal Architecture** | Ports (interfaces) e Adapters (implementações) |
| **Screaming Architecture** | Pastas organizadas por domínio, não por camada |
| **Microserviços** | 3 serviços com bancos isolados e comunicação via HTTP/RabbitMQ |
| **ADR** (Architectural Decision Records) | Decisões técnicas documentadas com justificativa |
| **Observabilidade** | Métricas + Logs + Dashboard centralizados (PLG Stack) |
| **Autenticação OAuth2/OIDC** | JWT emitido por IdP externo (Authentik), validado no gateway |
