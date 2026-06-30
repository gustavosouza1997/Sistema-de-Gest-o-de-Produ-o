# Arquitetura do Sistema

## Visão Macro

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser                                │
│              React 18 + Vite · shadcn/ui                    │
│                    :5173                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST (JWT no header)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                             │
│         NestJS · valida JWT (Authentik JWKS) · :3000        │
│         GET /health  ·  GET /metrics                        │
└──────┬──────────────────────────────────┬───────────────────┘
       │ /api/empresas*                    │ /api/producao*
       ▼                                  ▼
┌─────────────────┐          ┌─────────────────────────────┐
│ empresas-service│          │      producao-service       │
│   NestJS :3001  │          │        NestJS :3002         │
│  CQRS + ES      │          │       CQRS + Event          │
│  postgres-      │          │       Sourcing real         │
│  empresas       │          │    postgres-producao        │
└─────────────────┘          └─────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Identity Provider                          │
│          Authentik (OIDC) · :9000                           │
│    → emite JWT que o api-gateway valida via JWKS            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Observabilidade                          │
│  Prometheus :9090  ←scrape /metrics (15s)                   │
│  Promtail → Loki :3100 ←Docker logs                        │
│  Grafana :3003 ← Dashboard provisionado automaticamente     │
└─────────────────────────────────────────────────────────────┘
```

---

## Padrões Arquiteturais

### Microserviços
Cada domínio é um serviço independente com seu próprio banco de dados.
Ver [[Microserviços]]

### Arquitetura Hexagonal (Ports & Adapters)
O domínio fica no centro, isolado de frameworks e infraestrutura.
Ver [[Hexagonal e Screaming]]

### Screaming Architecture
A estrutura de pastas grita o domínio, não a tecnologia.
Ver [[Hexagonal e Screaming]]

### CQRS
Comandos (escrita) e Queries (leitura) em fluxos separados com `@nestjs/cqrs`.
Ver [[CQRS e Event Sourcing]]

### Event Sourcing Real
Estado dos agregados reconstruído por replay de eventos. Tabelas SQL são projeções de leitura.
Ver [[CQRS e Event Sourcing]]

---

## Serviços em Execução

| Serviço | Responsabilidade | Porta |
|---------|-----------------|-------|
| `api-gateway` | Roteamento, validação JWT | 3000 |
| `producao-service` | Modelos, Ordens, Remessas, Lotes (Event Sourcing) | 3001 |
| `empresas-service` | CRUD de empresas | 3002 |
| `authentik-server` | Identity Provider OIDC | 9000 |
| Prometheus | Coleta de métricas | 9090 |
| Grafana | Dashboards | 3003 |
| Loki | Logs | 3100 |
| RabbitMQ | Message Broker (infra pronta) | 15672 |

---

## Comunicação entre Serviços

- **Frontend → Gateway:** HTTP REST com JWT no `Authorization` header
- **Gateway → Serviços:** HTTP proxy (`http-proxy-middleware`)
- **Inter-serviços:** RabbitMQ (infraestrutura pronta, consumers a implementar)

---

## Fluxo de Autenticação

```
1. Usuário acessa /login
2. Authentik autentica e emite JWT (RS256)
3. Frontend armazena JWT no localStorage/sessionStorage
4. Cada request inclui: Authorization: Bearer {jwt}
5. api-gateway valida assinatura via JWKS (http://authentik:9000/...)
6. Se válido: proxy para o serviço destino com os headers do usuário
7. Se inválido: 401 Unauthorized
```
