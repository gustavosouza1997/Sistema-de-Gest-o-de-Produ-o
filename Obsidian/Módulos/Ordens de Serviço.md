# Módulo — Ordens de Serviço

Parte de [[Módulos/Produção]] · Serviço: `producao-service`

## Responsabilidade

Uma Ordem de Serviço (OS) representa uma solicitação de produção vinculada a uma **empresa** e a uma **nota fiscal de origem**. Dentro de cada OS existem **Remessas** (grupos lógicos) e dentro de cada remessa existem **Lotes** (unidades rastreáveis por código de barras).

---

## Hierarquia de Domínio

```
Ordem de Serviço
├── empresaId          (qual empresa encomendou)
├── notaFiscalOrigem   (NF da matéria-prima)
├── numero             (OS-2026-0001, sequencial por ano)
├── status             (rascunho → aberta → em_execucao → concluida/cancelada)
│
└── Remessa[]
    ├── nome           (ex: "Remessa A", "Sandália Rosa")
    │
    └── Lote[]
        ├── identificador    (ex: "L001")
        ├── codigoBarras     (lido pelo scanner de produção)
        ├── modeloId         (qual modelo de calçado)
        ├── quantidade       (pares neste lote)
        └── etapa            (preparo → costura → revisao_conserto → entregue)
```

O `totalPares` de uma remessa é a soma dos `quantidade` de seus lotes.

---

## Ciclo de Vida da OS

```
RASCUNHO ──abrir()──► ABERTA ──iniciarExecucao()──► EM_EXECUCAO ──concluir()──► CONCLUÍDA
    │                    │                                 │
    └──cancelar()──►     └──────────cancelar()────────────┘
                      CANCELADA
```

## Ciclo de Vida do Lote (Etapas de Fabricação)

```
PREPARO ──► COSTURA ──► REVISÃO/CONSERTO ──► ENTREGUE
```

Avanço disparado por leitura de código de barras no [[Módulos/Controle de Produção]].

---

## Eventos de Domínio (Event Sourcing)

Todo o estado da OS é derivado do replay desta sequência de eventos:

| Evento | Campos relevantes |
|--------|------------------|
| `OrdemCriada` | id, empresaId, notaFiscalOrigem, numero, criadaEm |
| `OrdemAberta` | abertura |
| `OrdemEmExecucao` | — |
| `OrdemConcluida` | conclusao |
| `OrdemCancelada` | — |
| `RemessaAdicionada` | remessaId, nome |
| `RemessaRemovida` | remessaId |
| `LoteAdicionado` | remessaId, loteId, identificador, codigoBarras, modeloId, quantidade |
| `LoteEditado` | remessaId, loteId, (campos editados) |
| `LoteRemovido` | remessaId, loteId |
| `EtapaLoteAvancada` | remessaId, loteId, etapaAnterior, etapaAtual |

Todos os eventos são gravados na tabela `events` com `stream_id = "ordem-{id}"`. Ver [[CQRS e Event Sourcing]].

---

## Commands e Queries

### Commands

| Command | Efeito | Pré-condição |
|---------|--------|--------------|
| `CriarOrdemCommand` | Cria OS em rascunho | — |
| `AbrirOrdemCommand` | Abre a OS | status = rascunho |
| `IniciarExecucaoOrdemCommand` | Inicia produção | status = aberta |
| `ConcluirOrdemCommand` | Conclui OS | status = em_execucao |
| `CancelarOrdemCommand` | Cancela OS | status ≠ concluida/cancelada |
| `AdicionarRemessaCommand` | Adiciona remessa | — |
| `RemoverRemessaCommand` | Remove remessa | — |
| `AdicionarLoteCommand` | Adiciona lote à remessa | — |
| `EditarLoteCommand` | Edita lote | — |
| `RemoverLoteCommand` | Remove lote | — |
| `AvancarEtapaLoteCommand` | Avança etapa manualmente | etapa ≠ entregue |
| `AvancarPorBarcodeCommand` | Avança etapa por barcode | código existente, OS ativa |

### Queries

| Query | Descrição |
|-------|-----------|
| `ListarOrdensQuery` | Lista com filtros `empresaId` e `status`; retorna totalRemessas e totalPares |
| `BuscarOrdemQuery` | Detalhe completo com remessas, lotes e etapas |

---

## API Endpoints

Base: `POST /api/producao/ordens`

| Método | Rota | Ação |
|--------|------|------|
| POST | `/producao/ordens` | Criar OS |
| GET | `/producao/ordens` | Listar OS (query: empresaId, status) |
| GET | `/producao/ordens/:id` | Detalhe da OS |
| PATCH | `/producao/ordens/:id/abrir` | Abrir |
| PATCH | `/producao/ordens/:id/iniciar` | Iniciar execução |
| PATCH | `/producao/ordens/:id/concluir` | Concluir |
| PATCH | `/producao/ordens/:id/cancelar` | Cancelar |
| POST | `/producao/ordens/:id/remessas` | Adicionar remessa |
| DELETE | `/producao/ordens/:id/remessas/:remessaId` | Remover remessa |
| POST | `/producao/ordens/:id/remessas/:remessaId/lotes` | Adicionar lote |
| PATCH | `/producao/ordens/:id/remessas/:remessaId/lotes/:loteId` | Editar lote |
| DELETE | `/producao/ordens/:id/remessas/:remessaId/lotes/:loteId` | Remover lote |
| PATCH | `/producao/ordens/:id/remessas/:remessaId/lotes/:loteId/avancar` | Avançar etapa manualmente |
| PATCH | `/producao/lotes/barcode/:codigo/avancar` | Avançar por código de barras |

---

Ver [[Módulos/Controle de Produção]] para o painel kanban de acompanhamento.
