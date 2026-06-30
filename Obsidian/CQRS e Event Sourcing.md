# CQRS e Event Sourcing

## Visão Geral

O sistema implementa **CQRS com Event Sourcing verdadeiro** no `producao-service`. O event store é a **fonte primária de verdade** — o estado dos agregados é derivado exclusivamente pelo replay dos eventos.

```
          WRITE SIDE                       READ SIDE
          ──────────                       ─────────
  Command → Handler → Aggregate           Query → Handler
              │           │                          │
              │     emite eventos              lê da projeção
              │                                      │
              ▼                                      ▼
       EventStore.append()              ordens_de_servico (SQL)
       (tabela events)                  remessas (SQL)
              │                         lotes (SQL)
              │
       OrdemRepository.save()
       ├── append no event store
       └── upsert na projeção SQL ──────► (mantém leitura rápida)
```

---

## CQRS — Separação de Responsabilidades

### Command Side (escrita)
- Cada mutação é um `Command` com um `CommandHandler`
- O handler carrega o agregado via **replay de eventos**, aplica a operação, salva
- Nunca lê o estado das tabelas relacionais para operações de escrita

### Query Side (leitura)
- Queries leem diretamente das tabelas de projeção (SQL rápido)
- Não passam pelo domínio nem pelo event store
- `ListarOrdens.handler.ts` → `repo.find({ where, order })` (projeção)
- `BuscarOrdem.handler.ts` → `repo.findOneBy({ id })` + `toDomain()` (projeção)

---

## Event Sourcing — Como Funciona

### Fluxo de escrita

```typescript
// 1. Handler carrega o agregado por replay
const ordem = await repo.findById(command.ordemId);
// → eventStore.getStream('ordem-{id}') → OrdemDeServico.reconstituirDeEventos(events)

// 2. Operação de domínio emite evento
const updated = ordem.avancarEtapaLote(remessaId, loteId);
// → addEvent(new EtapaLoteAvancada(...))

// 3. Repository salva: appenda evento + upsert projeção
await repo.save(updated);
// → eventStore.append('ordem-{id}', [EtapaLoteAvancada])
// → repo.save({ ...projeção SQL... })
```

### Reconstrução do Agregado (`reconstituirDeEventos`)

```typescript
static reconstituirDeEventos(records: EventRecord[]): OrdemDeServico {
  let props: any = { remessas: [] };

  for (const { eventType, payload } of records) {
    switch (eventType) {
      case 'OrdemCriada':
        props = { id: payload.aggregateId, empresaId: payload.empresaId,
                  notaFiscalOrigem: payload.notaFiscalOrigem,
                  numero: payload.numero, status: 'rascunho',
                  remessas: [], criadaEm: new Date(payload.criadaEm) };
        break;
      case 'OrdemAberta':
        props.status = 'aberta';
        props.abertura = new Date(payload.abertura);
        break;
      case 'RemessaAdicionada':
        props.remessas = [...props.remessas,
          Remessa.reconstituir({ id: payload.remessaId, nome: payload.nome, lotes: [] })];
        break;
      case 'LoteAdicionado':
        // adiciona lote à remessa correta
        break;
      case 'EtapaLoteAvancada':
        // atualiza etapa do lote
        break;
      // ... demais eventos
    }
  }
  return new OrdemDeServico(props);
}
```

---

## Tabela `events` (Event Store)

```sql
CREATE TABLE events (
  id          UUID PRIMARY KEY,
  stream_id   VARCHAR NOT NULL,    -- "ordem-{id}", "modelo-{id}"
  event_type  VARCHAR NOT NULL,    -- "OrdemCriada", "LoteAdicionado", ...
  payload     JSONB NOT NULL,      -- todos os campos do evento
  version     INT NOT NULL,        -- sequencial por stream
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX ON events (stream_id, version);
```

### Exemplo de stream

```
stream_id: "ordem-019f15d2-..."

version | event_type        | payload
--------|-------------------|---------
1       | OrdemCriada       | { numero, empresaId, notaFiscalOrigem, criadaEm }
2       | RemessaAdicionada | { remessaId, nome }
3       | LoteAdicionado    | { loteId, identificador, codigoBarras, modeloId, quantidade }
4       | OrdemAberta       | { abertura }
5       | EtapaLoteAvancada | { loteId, etapaAnterior: "preparo", etapaAtual: "costura" }
```

---

## Projeção SQL (Read Model)

As tabelas relacionais são mantidas como **projeção de leitura**, atualizadas sincronamente no `save()`:

| Tabela | Papel |
|--------|-------|
| `ordens_de_servico` | Projeção da OS (status, numero, criadaEm, ...) |
| `remessas` | Projeção das remessas (nome, ordemId) |
| `lotes` | Projeção dos lotes (etapa, codigoBarras, modeloId, quantidade) |

Permitem queries rápidas como `findAll({ empresaId, status })` sem replay.

---

## Eventos de Domínio Implementados

### producao-service — Ordens de Serviço

| Evento | Stream | Dados |
|--------|--------|-------|
| `OrdemCriada` | `ordem-{id}` | empresaId, notaFiscalOrigem, numero, criadaEm |
| `OrdemAberta` | idem | abertura |
| `OrdemEmExecucao` | idem | — |
| `OrdemConcluida` | idem | conclusao |
| `OrdemCancelada` | idem | — |
| `RemessaAdicionada` | idem | remessaId, nome |
| `RemessaRemovida` | idem | remessaId |
| `LoteAdicionado` | idem | loteId, identificador, codigoBarras, modeloId, quantidade |
| `LoteEditado` | idem | loteId, (campos editados) |
| `LoteRemovido` | idem | loteId |
| `EtapaLoteAvancada` | idem | loteId, etapaAnterior, etapaAtual |

### producao-service — Modelos

| Evento | Stream |
|--------|--------|
| `ModeloCriado` | `modelo-{id}` |
| `ModeloDesativado` | idem |
| `ModeloReativado` | idem |
| `ReferenciaAdicionada` | idem |
| `OperacaoAdicionada` | idem |

---

Ver [[Hexagonal e Screaming]] para onde Commands e Queries se encaixam na estrutura de pastas.
