# ADR-001 — Microserviços como estilo arquitetural

**Data:** 2025-06  
**Status:** Aceita

---

## Contexto

O sistema CalcadosPadilha possui domínios de negócio distintos: Empresas, Usuários (via Authentik) e Produção (Modelos, Ordens de Serviço, Controle de Produção). Cada domínio tem ciclos de desenvolvimento, carga e escalabilidade potencialmente independentes.

---

## Alternativas consideradas

| Alternativa | Descrição | Motivo de rejeição |
|-------------|-----------|-------------------|
| **Monólito modular** | Um único processo com módulos bem separados internamente | Escalabilidade acoplada; deploy único para qualquer mudança |
| **Microserviços** ✅ | Serviços independentes por domínio, com banco e deploy próprios | — |
| **Serverless** | Funções individuais por endpoint | Complexidade para Event Sourcing; cold start; difícil de observar |

---

## Decisão

Adotar microserviços com os seguintes serviços:

| Serviço | Domínio | Porta |
|---------|---------|-------|
| `api-gateway` | Roteamento, validação de token | 3000 |
| `producao-service` | Modelos, Ordens de Serviço, Controle de Produção | 3001 |
| `empresas-service` | Cadastro de empresas | 3002 |

Autenticação delegada ao **Authentik** (não é um microserviço próprio — ver [[ADR-007 — Authentik como IdP]]).

---

## Critérios de decisão

- Isolamento de falhas: falha no controle de produção não derruba o cadastro de empresas
- Escalabilidade independente: `producao-service` pode escalar sem tocar nos outros
- Deploys independentes por equipe/feature
- Event Sourcing requer Event Store por domínio → natural separar por serviço

---

## Consequências

**Positivas:**
- Cada serviço pode evoluir e escalar independentemente
- Isolamento de falhas entre domínios
- Banco de dados por serviço — sem acoplamento via schema compartilhado

**Negativas / Trade-offs:**
- Complexidade operacional maior (Docker Compose → Kubernetes no futuro)
- Debugging distribuído requer observabilidade (Prometheus + Loki + Grafana — ver [[ADR-006 — PLG Stack]])
- Consistência eventual entre serviços (não há transações distribuídas — usar Saga/Choreography)

---

## Revisão

Revisar se `empresas-service` justifica ser um serviço separado ou deve ser incorporado ao `producao-service` após os primeiros meses de desenvolvimento.
