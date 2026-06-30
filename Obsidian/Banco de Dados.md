# Banco de Dados

Cada serviço tem seu próprio PostgreSQL isolado. Nenhum serviço acessa o banco do outro.

---

## `producao_db` (producao-service)

### Diagrama de Entidades

```
modelos
 ├── referencias (N)
 │    └── operacoes_referencia (N)
 └── roteiro_operacoes (N)

ordens_de_servico
 └── remessas (N)
      └── lotes (N)

events  ← event store (append-only)
```

### `ordens_de_servico`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK (ULID-compatible) |
| empresa_id | UUID | Empresa que encomendou |
| nota_fiscal_origem | VARCHAR | Número da NF de origem |
| numero | VARCHAR | OS-2026-0001 (sequencial por ano) |
| status | VARCHAR | rascunho / aberta / em_execucao / concluida / cancelada |
| criada_em | TIMESTAMPTZ | Data de criação |
| abertura | TIMESTAMPTZ | Quando foi aberta |
| conclusao | TIMESTAMPTZ | Quando foi concluída |

> **Atenção:** esta tabela é uma **projeção de leitura**. A fonte de verdade são os eventos no event store.

### `remessas`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| ordem_id | UUID | FK → ordens_de_servico |
| nome | VARCHAR | Nome da remessa (ex: "Remessa A") |

### `lotes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| remessa_id | UUID | FK → remessas |
| identificador | VARCHAR | Ex: "L001" |
| codigo_barras | VARCHAR | Código único para scanner (nullable) |
| modelo_id | UUID | Modelo de calçado a ser produzido |
| quantidade | INT | Número de pares |
| etapa | VARCHAR | preparo / costura / revisao_conserto / entregue |

### `modelos`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| empresa_id | UUID | Empresa proprietária |
| sigla | VARCHAR | Código único por empresa |
| nome | VARCHAR | Nome do modelo |
| ativo | BOOLEAN | Soft delete |
| criado_em | TIMESTAMPTZ | — |

### `referencias`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| modelo_id | UUID | FK → modelos |
| nome | VARCHAR | Ex: "Tamanho 38 Preto" |

### `events` (Event Store — append-only)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| stream_id | VARCHAR | `ordem-{id}`, `modelo-{id}` |
| event_type | VARCHAR | `OrdemCriada`, `LoteAdicionado`, etc. |
| payload | JSONB | Todos os campos do evento |
| version | INT | Sequencial por stream (1, 2, 3...) |
| occurred_at | TIMESTAMPTZ | Timestamp do evento |

**Índice único:** `(stream_id, version)` — garante ordem e idempotência.

---

## `empresas_db` (empresas-service)

### `empresas`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| nome | VARCHAR | Nome da empresa |
| cnpj | VARCHAR | CNPJ (único) |
| telefone | VARCHAR | Contato (nullable) |
| email | VARCHAR | E-mail (nullable) |
| ativo | BOOLEAN | Soft delete |
| criado_em | TIMESTAMPTZ | — |
| atualizado_em | TIMESTAMPTZ | — |

### `events` (Event Store)

Mesma estrutura do `producao-service`. Streams no formato `empresa-{id}`.

---

## Convenções

- **IDs**: UUID v7 (ordenável por tempo, gerado com `uuid` npm package)
- **Sincronização**: TypeORM `synchronize: true` (dev) — cria/altera tabelas automaticamente
- **Soft delete**: campo `ativo` boolean (não há `DELETE` real nas entidades de negócio)
- **Cascata**: lotes são deletados em cascata quando a remessa é removida (`orphanedRowAction: 'delete'`)
