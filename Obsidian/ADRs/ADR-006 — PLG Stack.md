# ADR-006 — Prometheus + Loki + Grafana (PLG Stack)

**Data:** 2025-06  
**Status:** Aceita

---

## Contexto

Com múltiplos microserviços rodando em Docker, precisamos de visibilidade centralizada sobre:
- Saúde dos serviços (latência, error rate, uptime)
- Logs distribuídos em um único lugar
- Alertas quando algo sai do normal

---

## Alternativas consideradas

| Alternativa | Descrição | Motivo de rejeição |
|-------------|-----------|-------------------|
| **ELK Stack** (Elasticsearch + Logstash + Kibana) | Solução completa de logs e busca | Consumo de memória elevado; Elasticsearch pesado para infra local |
| **Datadog / New Relic** | SaaS de observabilidade completa | Custo; dados saem do ambiente local |
| **PLG Stack** ✅ | Prometheus + Loki + Grafana open-source | — |
| **OpenTelemetry puro** | Instrumentação vendor-neutral | Precisa de backend (Jaeger, Tempo) — adiciona complexidade |

---

## Decisão

Adotar **PLG Stack**:

| Ferramenta | Função |
|------------|--------|
| **Prometheus** | Scrape de métricas HTTP nos endpoints `/metrics` de cada serviço |
| **Loki** | Agregação de logs estruturados (JSON) enviados pelo Promtail |
| **Promtail** | Agente que coleta logs dos containers Docker e envia ao Loki |
| **Grafana** | Dashboards, alertas e query unificada de métricas + logs |

**OpenTelemetry** será usado para instrumentação unificada (traces futuramente via Tempo).

---

## Critérios de decisão

- Open-source e self-hosted: dados ficam no ambiente local
- Grafana unifica Prometheus e Loki numa única UI
- Loki tem custo de armazenamento muito menor que Elasticsearch (não indexa tudo)
- prom-client é a biblioteca padrão para Node.js/TypeScript
- Stack amplamente adotada na indústria (curva de aprendizado compartilhada)

---

## Consequências

**Positivas:**
- Visibilidade centralizada de todos os serviços em Grafana
- Logs e métricas correlacionados na mesma UI
- Alertas configuráveis no Grafana (email, webhook, Slack)
- Custo zero de licença

**Negativas / Trade-offs:**
- Requer configuração e manutenção da stack de observabilidade (docker-compose separado)
- Prometheus usa modelo pull (scrape) — serviços precisam expor `/metrics`
- Sem tracing distribuído por padrão (adicionar Tempo + OpenTelemetry no futuro)

---

Ver [[Observabilidade]] para configs completas de Prometheus, Loki, Promtail e Grafana.
