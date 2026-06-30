# ADR-002 — Arquitetura Hexagonal + Screaming Architecture

**Data:** 2025-06  
**Status:** Aceita

---

## Contexto

Com CQRS e Event Sourcing, o domínio precisa ser testável de forma isolada, sem depender de banco de dados, HTTP ou qualquer framework. Precisamos de uma estrutura que comunique o domínio sem ambiguidade.

---

## Alternativas consideradas

| Alternativa | Descrição | Motivo de rejeição |
|-------------|-----------|-------------------|
| **Layered (MVC)** | controllers/ services/ repositories/ | Domínio depende do ORM; pastas gritam tecnologia, não negócio |
| **Hexagonal** ✅ | Ports no domínio, Adapters na infraestrutura | — |
| **Clean Architecture** | Similar ao hexagonal, com Use Cases explícitos e mais camadas | Overhead de abstração para o tamanho atual do time |

---

## Decisão

Adotar **Arquitetura Hexagonal** com **Screaming Architecture** nas pastas:

```
producao-service/src/
├── modelos/                         ← grita o domínio
│   ├── domain/
│   │   ├── Modelo.ts                ← entidade pura, sem imports de framework
│   │   ├── ModeloRepository.port.ts ← interface (porta de saída)
│   │   └── events/
│   │       └── ModeloCriado.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── CriarModelo.command.ts
│   │   │   └── CriarModelo.handler.ts
│   │   └── queries/
│   │       └── ListarModelos.handler.ts
│   └── infrastructure/
│       ├── ModeloTypeormRepository.ts   ← adapter que implementa a porta
│       └── ModeloController.ts
├── ordens-de-servico/
└── controle-de-producao/
```

---

## Critérios de decisão

- Domínio deve ser testável sem banco de dados (mocking da porta)
- Troca de ORM (TypeORM → Prisma) não deve afetar o domínio
- Estrutura deve comunicar o negócio para qualquer desenvolvedor que abrir o projeto

---

## Consequências

**Positivas:**
- Domínio 100% testável em memória (sem Docker, sem banco)
- Troca de infraestrutura (banco, framework, mensageria) sem tocar no domínio
- Onboarding mais rápido: a pasta `modelos/` diz o que o serviço faz

**Negativas / Trade-offs:**
- Mais arquivos e níveis de indireção vs. uma estrutura flat
- Ports (interfaces) criam boilerplate que frameworks modernos (NestJS) reduzem via DI

---

Ver [[Hexagonal e Screaming]] para exemplos de código.
