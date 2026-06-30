# ADR-008 — Framework HTTP: NestJS vs Fastify

**Data:** 2025-06  
**Status:** Aceita

---

## Contexto

Precisamos de um framework HTTP para os microserviços em TypeScript. O framework precisa se integrar bem com Hexagonal Architecture, CQRS, Event Sourcing e TypeORM.

---

## Alternativas comparadas

### NestJS

**O que é:** Framework opinionado para Node.js com DI (Injeção de Dependência), decorators e módulos. Tem um módulo oficial `@nestjs/cqrs` para CQRS.

| Prós | Contras |
|------|---------|
| Módulo `@nestjs/cqrs` nativo (CommandBus, QueryBus, EventBus) | Mais pesado e com mais boilerplate |
| DI nativo — ports/adapters encaixam naturalmente | Opinionado — pode dificultar arquitetura hexagonal "pura" |
| `@nestjs/typeorm` integra TypeORM sem configuração manual | Acoplamento ao framework se não tomar cuidado |
| Comunidade enorme, docs excelentes | Decorators "mágicos" podem esconder o fluxo |
| Geração de código com CLI (`nest generate`) | |

### Fastify

**O que é:** Framework HTTP minimalista, focado em performance. Sem DI nativa — requer biblioteca externa (Awilix, tsyringe).

| Prós | Contras |
|------|---------|
| Mais rápido (benchmark de performance) | Sem DI nativa — configuração manual do container |
| Menos opinionado — mais liberdade na arquitetura | CQRS precisa ser implementado manualmente ou com lib externa |
| Bundle menor | Menos exemplos de arquitetura hexagonal + CQRS disponíveis |
| Validação com JSON Schema built-in | TypeORM precisa ser wired manualmente |

---

## Recomendação

**NestJS** — pelo módulo `@nestjs/cqrs` que resolve o CommandBus/QueryBus/EventBus nativamente, pela DI que encaixa bem nos ports da arquitetura hexagonal, e pela maturidade do ecossistema com TypeORM.

O risco de acoplamento ao NestJS é mitigado mantendo o **domínio e a camada de aplicação (commands/queries/handlers) sem imports do NestJS** — apenas a infraestrutura (controllers, repositories, modules) usa decorators do framework.

---

## Decisão

- [x] **NestJS** ✅
- [ ] ~~Fastify~~
- [ ] ~~Outro~~

---

## Consequências se escolher NestJS

**Positivas:**
- `@nestjs/cqrs` resolve CommandBus, QueryBus, EventBus sem código custom
- DI do NestJS implementa ports automaticamente via `@Injectable()` + `@Inject(TOKEN)`
- Ecossistema: `@nestjs/typeorm`, `@nestjs/swagger`, `@nestjs/config`

**Negativas:**
- Mais decorators e módulos para configurar
- Migrar de NestJS no futuro tem custo médio
