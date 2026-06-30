# CalcadosPadilha — Sistema de Gestão de Produção

Sistema web para gestão de produção de calçados: empresas, modelos, ordens de serviço e controle de produção por etapas com leitura de código de barras.

Arquitetura: **Microserviços · Hexagonal · Screaming · CQRS · Event Sourcing real**

---

## Módulos Implementados

- [[Módulos/Usuários]] — autenticação via Authentik (OIDC/JWT)
- [[Entidades/Empresas]] — cadastro de empresas clientes
- [[Módulos/Modelos]] — catálogo de modelos de calçados com referências e roteiro de produção
- [[Módulos/Ordens de Serviço]] — OS vinculadas a empresa e nota fiscal, com Remessas e Lotes
- [[Módulos/Controle de Produção]] — kanban full-screen com avanço por código de barras

---

## Arquitetura

- [[Arquitetura]] — visão macro com diagrama de serviços
- [[Microserviços]] — serviços em execução, estrutura de pastas, bancos isolados
- [[Hexagonal e Screaming]] — ports & adapters, estrutura por domínio
- [[CQRS e Event Sourcing]] — event sourcing verdadeiro implementado
- [[Observabilidade]] — Prometheus + Loki v3 + Grafana com dashboard provisionado

---

## Decisões Técnicas (ADRs)

| #                                                     | Decisão                                      | Status                  |
| ----------------------------------------------------- | -------------------------------------------- | ----------------------- |
| [[ADRs/ADR-001 — Microserviços\|001]]                 | Microserviços                                | ✅ Implementado          |
| [[ADRs/ADR-002 — Hexagonal e Screaming\|002]]         | Hexagonal + Screaming                        | ✅ Implementado          |
| [[ADRs/ADR-003 — CQRS e Event Sourcing\|003]]         | CQRS + Event Sourcing                        | ✅ Implementado          |
| [[ADRs/ADR-004 — TypeScript TypeORM PostgreSQL\|004]] | TypeScript + TypeORM + PostgreSQL            | ✅ Implementado          |
| [[ADRs/ADR-005 — shadcn-ui\|005]]                     | shadcn/ui + Tailwind                         | ✅ Implementado          |
| [[ADRs/ADR-006 — PLG Stack\|006]]                     | Prometheus + Loki + Grafana                  | ✅ Implementado          |
| [[ADRs/ADR-007 — Authentik como IdP\|007]]            | Authentik como IdP                           | ✅ Implementado          |
| [[ADRs/ADR-008 — NestJS vs Fastify\|008]]             | Framework HTTP: **NestJS**                   | ✅ Implementado          |
| [[ADRs/ADR-009 — RabbitMQ vs Kafka\|009]]             | Message Broker: **RabbitMQ**                 | ✅ Infraestrutura pronta |
| [[ADRs/ADR-010 — UUID vs ID Sequencial\|010]]         | Formato de ID: **UUID v7 (ULID-compatível)** | ✅ Implementado          |

---

## Referência

- [[Tech Stack]] — tecnologias efetivamente em uso
- [[Banco de Dados]] — schema real das tabelas
- [[API]] — endpoints REST implementados

---

## Status do Projeto

| Componente | Status |
|-----------|--------|
| Arquitetura e ADRs | ✅ Concluído |
| Docker Compose (todos os serviços) | ✅ Concluído |
| `empresas-service` (CRUD completo) | ✅ Concluído |
| `producao-service` — Modelos | ✅ Concluído |
| `producao-service` — Ordens de Serviço | ✅ Concluído |
| `producao-service` — Event Sourcing real | ✅ Concluído |
| `api-gateway` (proxy + auth JWT) | ✅ Concluído |
| Frontend (React + shadcn/ui + TanStack Query) | ✅ Concluído |
| Controle de Produção (kanban + barcode) | ✅ Concluído |
| Stack PLG (Prometheus + Loki + Grafana) | ✅ Concluído |
| Dashboard Grafana provisionado | ✅ Concluído |
