# ADR-010 — Identificadores: UUID vs ID Sequencial

**Data:** 2025-06  
**Status:** Aceita

---

## Contexto

Em microserviços com Event Sourcing, os IDs são gerados nas entidades de domínio (não pelo banco de dados). Precisamos escolher entre UUIDs e IDs sequenciais.

---

## Alternativas comparadas

| Critério | UUID v4 | UUID v7 | INT Sequencial |
|----------|---------|---------|----------------|
| Geração no domínio (sem banco) | ✅ | ✅ | ❌ (precisa do banco) |
| Unicidade entre serviços | ✅ | ✅ | ❌ (colisão entre serviços) |
| Ordenável cronologicamente | ❌ | ✅ | ✅ |
| Tamanho | 36 chars | 36 chars | 1-10 chars |
| Performance de índice no PostgreSQL | ⚠️ menor | ✅ melhor que v4 | ✅ melhor |
| Previsibilidade (segurança) | ✅ aleatório | ✅ aleatório | ❌ enumerável |
| Legibilidade em logs | ❌ | ❌ | ✅ |

---

## Recomendação

**UUID v7** — combina o melhor dos dois mundos:
- Gerado no domínio sem dependência do banco
- Monotonicamente crescente (baseado em timestamp) → índices B-tree eficientes
- Único globalmente → sem colisão entre serviços
- Padrão emergente que o PostgreSQL 17 suporta nativamente via `gen_random_uuid()` (v4) — usar `uuid-v7` npm package até suporte nativo ao v7

```typescript
// shared/domain/IdGenerator.ts
import { v7 as uuidv7 } from 'uuid';

export const generateId = (): string => uuidv7();
```

---

## Decisão

- [x] **UUID v7** ✅
- [ ] ~~UUID v4~~
- [ ] ~~INT Sequencial~~

---

## Consequências se escolher UUID v7

**Positivas:**
- IDs gerados no domínio — sem round-trip ao banco para criar uma entidade
- Ordenação cronológica nativa — queries `ORDER BY id` refletem ordem de criação
- Sem colisão entre Event Stores de serviços diferentes

**Negativas:**
- URLs e logs com IDs longos (36 chars)
- Pacote externo até PostgreSQL suportar v7 nativamente
