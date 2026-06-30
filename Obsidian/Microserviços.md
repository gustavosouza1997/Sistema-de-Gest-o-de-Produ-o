# Microserviços

Cada serviço tem seu próprio processo, banco de dados e imagem Docker. Ver [[Arquitetura]] para o diagrama geral.

---

## Serviços em Execução

### `api-gateway` · porta 3000
- Único ponto de entrada do frontend
- Valida JWT emitido pelo Authentik (JWKS endpoint)
- Roteia `api/empresas*` → `empresas-service:3000`
- Roteia `api/producao*` → `producao-service:3000`
- Expõe `GET /health` e `GET /metrics`
- Sem lógica de negócio

### `producao-service` · porta 3001
- Domínio de produção: Modelos, Ordens de Serviço, Remessas, Lotes
- **Event Sourcing real** — estado reconstruído por replay de eventos
- CQRS com CommandBus e QueryBus (NestJS CQRS)
- Banco: `producao_db` (PostgreSQL)
- Tabelas de estado: `ordens_de_servico`, `remessas`, `lotes`, `modelos`, `referencias`, `roteiros`, `operacoes`
- Tabela event store: `events`

### `empresas-service` · porta 3002
- CRUD de empresas (nome, CNPJ, telefone, email, ativo)
- CQRS com CommandBus e QueryBus
- Banco: `empresas_db` (PostgreSQL)
- Event store: tabela `events`

### `authentik-server` · porta 9000
- Identity Provider externo (Authentik open-source)
- Emite JWT/OIDC
- Interface de admin: `http://localhost:9000`

### Observabilidade
| Serviço | Porta |
|---------|-------|
| Prometheus | 9090 |
| Grafana | 3003 |
| Loki | 3100 |
| RabbitMQ management | 15672 |

---

## Estrutura de Pastas (Hexagonal + Screaming)

```
producao-service/
└── src/
    ├── ordens-de-servico/         ← domínio (screaming)
    │   ├── domain/
    │   │   ├── OrdemDeServico.ts  ← aggregate root
    │   │   ├── Remessa.ts
    │   │   ├── Lote.ts
    │   │   ├── OrdemRepository.port.ts
    │   │   └── events/
    │   │       ├── OrdemCriada.ts
    │   │       ├── RemessaAdicionada.ts
    │   │       ├── LoteAdicionado.ts
    │   │       ├── EtapaLoteAvancada.ts
    │   │       └── ...
    │   ├── application/
    │   │   ├── commands/
    │   │   │   ├── CriarOrdem.command.ts
    │   │   │   ├── CriarOrdem.handler.ts
    │   │   │   ├── AvancarEtapaLote.handler.ts
    │   │   │   └── AvancarPorBarcode.handler.ts
    │   │   └── queries/
    │   │       ├── ListarOrdens.handler.ts
    │   │       └── BuscarOrdem.handler.ts
    │   └── infrastructure/
    │       ├── persistence/
    │       │   ├── OrdemTypeormRepository.ts  ← event store + projeção
    │       │   ├── OrdemEntity.ts
    │       │   ├── RemessaEntity.ts
    │       │   └── LoteEntity.ts
    │       ├── http/
    │       │   ├── OrdemController.ts
    │       │   └── LoteController.ts
    │       └── OrdensDeServicoModule.ts
    ├── modelos/                   ← outro domínio (screaming)
    └── shared/
        ├── domain/
        │   ├── AggregateRoot.ts   ← pullEvents() / addEvent()
        │   └── DomainEvent.ts
        ├── event-store/
        │   ├── EventStore.ts      ← append() / getStream()
        │   └── EventStoreEntity.ts
        └── metrics/
            ├── metrics.ts         ← contadores, histogramas, gauges
            └── MetricsModule.ts   ← middleware HTTP + coleta lazy
```

---

## Bancos de Dados Isolados

| Serviço | Host Docker | Database |
|---------|-------------|----------|
| `producao-service` | `postgres-producao` | `producao_db` |
| `empresas-service` | `postgres-empresas` | `empresas_db` |
| `authentik-server` | `postgres-authentik` | `authentik` |

Nenhum serviço acessa diretamente o banco de outro.

---

## Comunicação entre Serviços

- **Frontend → Backend**: `api-gateway` (HTTP/REST via proxy)
- **Backend → Backend**: RabbitMQ (infraestrutura pronta, consumers ainda não implementados)
- **Auth**: JWT validado pelo `api-gateway` via JWKS do Authentik

---

Ver [[Hexagonal e Screaming]] para detalhes da arquitetura interna de cada serviço.
