# ADR-004 — TypeScript + TypeORM + PostgreSQL

**Data:** 2025-06  
**Status:** Aceita

---

## Contexto

Necessitamos de uma linguagem com tipagem forte no backend, um ORM maduro para PostgreSQL e um banco de dados robusto para produção.

---

## Alternativas consideradas

### Linguagem/Runtime

| Alternativa | Motivo de rejeição |
|-------------|-------------------|
| JavaScript (sem tipos) | Sem segurança de tipos em domínio complexo |
| **TypeScript** ✅ | — |
| Python + FastAPI | Sem isomorfismo com o frontend; ecossistema diferente |
| Go | Curva maior para Event Sourcing; menos maduro para ORM |

### ORM

| Alternativa | Motivo de rejeição |
|-------------|-------------------|
| **TypeORM** ✅ | Decorators TypeScript, migrations, maturidade | — |
| Prisma | Schema-first, menos flexível para raw queries do Event Store |
| Knex (query builder) | Muito low-level; sem entidades, sem migrations declarativas |
| Drizzle | Mais novo, menor ecossistema |

**Nota:** O Event Store usará `DataSource.query()` raw, pois TypeORM não foi projetado para Event Sourcing. TypeORM é usado para as entidades de projeção (Read Models).

### Banco de Dados

| Alternativa | Motivo de rejeição |
|-------------|-------------------|
| **PostgreSQL** ✅ | JSONB para payload de eventos, transações ACID, maturidade | — |
| MySQL | Suporte a JSONB inferior ao PostgreSQL |
| MongoDB | Sem transações ACID nativas; desnecessário para este domínio |
| SQLite | Apenas para desenvolvimento local |

---

## Decisão

- **Linguagem:** TypeScript (strict mode)
- **ORM:** TypeORM para read models e entidades de projeção
- **Event Store:** PostgreSQL com raw SQL via `DataSource.query()`
- **Banco:** PostgreSQL (um banco por serviço)

---

## Critérios de decisão

- Tipagem ponta-a-ponta (TypeScript frontend e backend)
- JSONB do PostgreSQL é ideal para armazenar `payload` de eventos
- TypeORM tem decorators que funcionam bem com NestJS (ver [[ADR-008 — NestJS vs Fastify]])
- Migrations gerenciadas pelo TypeORM

---

## Consequências

**Positivas:**
- Tipagem forte em todo o backend
- Migrations versionadas e reversíveis
- PostgreSQL suporta JSONB, índices parciais, transações robustas

**Negativas / Trade-offs:**
- TypeORM tem limitações conhecidas (lazy loading, circular deps)
- Event Store precisará de raw queries — dois patterns de acesso ao banco no mesmo serviço
- TypeORM v0.3 tem breaking changes em relação ao v0.2 — fixar versão no `package.json`
