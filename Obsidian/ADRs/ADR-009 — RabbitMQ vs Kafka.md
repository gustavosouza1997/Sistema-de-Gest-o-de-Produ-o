# ADR-009 — Message Broker: RabbitMQ vs Kafka

**Data:** 2025-06  
**Status:** Aceita

---

## Contexto

Os microserviços precisam se comunicar de forma assíncrona via eventos de domínio (ex: `OrdemAberta`, `EtapaConcluida`). Precisamos de um Message Broker para publicar e consumir esses eventos.

---

## Alternativas comparadas

### RabbitMQ

**O que é:** Message broker baseado em AMQP. Modelo push (broker entrega ao consumer). Foco em roteamento flexível de mensagens.

| Prós | Contras |
|------|---------|
| Simples de configurar e operar | Mensagens são deletadas após consumo (sem replay nativo) |
| UI de admin clara e fácil | Sem log persistente de eventos |
| Exchanges e routing keys para roteamento flexível | Replay requer implementação no Event Store (PostgreSQL) |
| Menor consumo de memória/CPU que Kafka | Não é um log de eventos — é um broker de mensagens |
| Bom para volume médio de mensagens | |

### Apache Kafka

**O que é:** Plataforma de streaming distribuída. Log particionado e imutável. Modelo pull (consumer busca do log).

| Prós | Contras |
|------|---------|
| Log imutável — replay de eventos nativo | Complexidade operacional maior (Zookeeper ou KRaft) |
| Consumer groups — múltiplos serviços consomem o mesmo evento | Mais recursos de CPU/memória |
| Retenção configurável (dias, semanas) | Overhead para volume baixo de eventos |
| Ideal para Event Sourcing em alta escala | Curva de aprendizado maior |
| Excelente para análise de dados / streaming | |

---

## Análise para este projeto

| Critério | RabbitMQ | Kafka |
|----------|----------|-------|
| Replay de eventos | ❌ (precisa do Event Store) | ✅ nativo |
| Complexidade operacional | ✅ Baixa | ❌ Média/Alta |
| Volume esperado (interno) | ✅ Adequado | ✅ Excessivo |
| Múltiplos consumers por evento | ✅ via exchanges | ✅ via consumer groups |
| Infra local (Docker) | ✅ Simples | ⚠️ Precisa de mais recursos |

**Contexto adicional:** Como já temos o Event Store no PostgreSQL, o replay de eventos **não depende do broker** — o PostgreSQL é a fonte de verdade. O broker serve apenas para notificação assíncrona entre serviços.

---

## Recomendação

**RabbitMQ** — dado que o replay de eventos é responsabilidade do Event Store (PostgreSQL), e o volume de mensagens é interno entre 2-3 serviços, a simplicidade operacional do RabbitMQ supera os benefícios do Kafka para este escopo.

Kafka faria sentido se:
- O volume de eventos fosse muito alto (milhões/dia)
- Houvesse necessidade de análise de streaming de dados
- O sistema fosse escalar para dezenas de serviços

---

## Decisão

- [x] **RabbitMQ** ✅
- [ ] ~~Kafka~~
- [ ] ~~Outro~~

---

## Docker Compose — RabbitMQ

```yaml
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # UI de admin
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  rabbitmq_data:
```

Acesso à UI: `http://localhost:15672` (admin/admin)
