# Módulo — Produção

## Responsabilidade

Domínio central do sistema. Gerencia o ciclo de vida de produção de calçados, desde o cadastro do modelo até o controle de execução das ordens de serviço.

---

## Submódulos

```
┌─────────────────────────────────────────────────┐
│                    Produção                      │
│                                                  │
│  ┌──────────┐   ┌─────────────────┐   ┌───────┐ │
│  │ Modelos  │──►│ Ordens de       │──►│Controle│ │
│  │          │   │ Serviço         │   │de Prod.│ │
│  └──────────┘   └─────────────────┘   └───────┘ │
│                                                  │
│  Cada modelo origina ordens de serviço.          │
│  Cada ordem tem seu controle de produção.        │
└─────────────────────────────────────────────────┘
```

| Submódulo | Descrição | Nota |
|-----------|-----------|------|
| [[Módulos/Modelos]] | Catálogo de modelos de calçados | Ponto de partida |
| [[Módulos/Ordens de Serviço]] | Ordens de produção por modelo | Vincula modelo → execução |
| [[Módulos/Controle de Produção]] | Acompanhamento de etapas e progresso | Operacional |

---

## Fluxo Geral

```
1. Cadastra Modelo
       │
       ▼
2. Cria Ordem de Serviço para o Modelo
   (define quantidade, prazo, responsável)
       │
       ▼
3. Abre Controle de Produção para a Ordem
   (registra etapas: corte, costura, solagem, acabamento)
       │
       ▼
4. Operadores atualizam o progresso de cada etapa
       │
       ▼
5. Ordem concluída → evento OrdemConcluida publicado
```

---

## Serviço responsável

`producao-service` — um único microserviço com os três submódulos internamente.

Internamente separados por domínio (screaming):
```
producao-service/src/
├── modelos/
├── ordens-de-servico/
└── controle-de-producao/
```

Cada submódulo tem sua própria pasta `domain/`, `application/` e `infrastructure/` seguindo [[Hexagonal e Screaming]].

---

## Eventos de domínio publicados

| Evento | Publicado por |
|--------|--------------|
| `ModeloCriado` | modelos |
| `ModeloAtualizado` | modelos |
| `OrdemAberta` | ordens-de-servico |
| `OrdemCancelada` | ordens-de-servico |
| `OrdemConcluida` | ordens-de-servico |
| `EtapaIniciada` | controle-de-producao |
| `EtapaConcluida` | controle-de-producao |
| `ProducaoConcluida` | controle-de-producao |

---

Ver [[Módulos/Modelos]], [[Módulos/Ordens de Serviço]], [[Módulos/Controle de Produção]].
