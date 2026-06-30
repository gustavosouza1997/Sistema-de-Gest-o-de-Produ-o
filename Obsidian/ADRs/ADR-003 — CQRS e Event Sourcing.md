# ADR-003 — CQRS + Event Sourcing

**Data:** 2025-06  
**Status:** ✅ Implementada

---

## Contexto

O domínio de produção precisa de:
- Auditoria completa: saber o estado de qualquer OS em qualquer momento do passado
- Rastreabilidade: quem fez o quê e quando em cada etapa de produção
- Leituras otimizadas independentes da escrita (ex: dashboard de produção vs. registro de etapa)

---

## Alternativas consideradas

| Alternativa | Descrição | Motivo de rejeição |
|-------------|-----------|-------------------|
| **CRUD simples** | UPDATE direto no banco | Sem auditoria; estado atual apaga histórico |
| **Audit log separado** | CRUD + tabela de log manual | Propensão a inconsistência; log pode ser bypassado |
| **CQRS sem Event Sourcing** | Separar leitura/escrita, mas guardar só estado final | Sem replay; sem auditoria de estado intermediário |
| **CQRS + Event Sourcing** ✅ | Estado derivado de eventos imutáveis | — |

---

## Decisão

Adotar **CQRS** para separar Commands (escrita) de Queries (leitura) e **Event Sourcing** com PostgreSQL como Event Store.

### CQRS

- **Command Side:** `CriarOrdemCommand`, `AbrirOrdemCommand`, etc. → executa regra de negócio no domínio → salva evento no Event Store
- **Query Side:** lê diretamente de projeções otimizadas (tabelas read-model no PostgreSQL)

### Event Store (tabela `events`)

```sql
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id   VARCHAR NOT NULL,    -- ex: "ordem-{uuid}"
  event_type  VARCHAR NOT NULL,    -- ex: "OrdemAberta"
  payload     JSONB NOT NULL,
  version     INT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ON events (stream_id, version);  -- garante ordem e idempotência
```

### Projeções (Read Models)

Cada leitura tem sua própria tabela projetada, atualizada por handlers de eventos:

| Evento | Projeção atualizada |
|--------|-------------------|
| `OrdemCriada` | `ordens_view` |
| `EtapaConcluida` | `controle_producao_view`, `progresso_por_os_view` |
| `OrdemConcluida` | `ordens_view`, `historico_producao_view` |

---

## Critérios de decisão

- Necessidade de auditoria total (legal e operacional)
- Replay de eventos para reconstruir estado ou popular novos read models
- Desacoplamento: queries nunca ficam lentas por conta de writes pesados

---

## Consequências

**Positivas:**
- Histórico completo e imutável de todas as mudanças
- Possível reconstruir qualquer estado passado (replay)
- Leituras otimizadas via projeções sem afetar a escrita
- Eventos publicados no Message Broker para comunicação entre serviços

**Negativas / Trade-offs:**
- Curva de aprendizado maior
- Eventual consistency: projeções podem estar levemente defasadas (ms)
- Queries simples exigem projeções — mais código para casos triviais
- TypeORM não foi projetado para Event Sourcing: o Event Store usará `DataSource.query()` raw

---

Ver [[CQRS e Event Sourcing]] para exemplos de código completos.
