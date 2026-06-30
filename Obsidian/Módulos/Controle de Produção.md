# Módulo — Controle de Produção

Parte de [[Módulos/Produção]] · Rota: `/controle` · Serviço: `producao-service`

## Responsabilidade

Painel kanban em tela cheia para acompanhar o progresso dos **lotes** nas etapas de fabricação. O avanço de etapa ocorre por **leitura de código de barras** — o operador aponta o leitor no lote físico e o sistema atualiza automaticamente.

---

## Interface (Frontend)

```
┌─────────────────────────────────────────────────────────────┐
│  🔍  [Campo de entrada de código de barras — sempre focado] │
│  ✅  Lote L001 | OS-2026-0001 | Remessa A → COSTURA         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   PREPARO    │   COSTURA    │  REVISÃO/    │   ENTREGUE     │
│   3 grupos   │   2 grupos   │  CONSERTO    │   1 grupo      │
│   45 pares   │   60 pares   │   1 grupo    │   30 pares     │
│              │              │   15 pares   │                │
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌────────────┐ │
│ │OS-2026-01│ │ │OS-2026-01│ │ │OS-2026-02│ │ │OS-2026-01  │ │
│ │NF-001    │ │ │NF-001    │ │ │NF-002    │ │ │NF-001      │ │
│ │Empresa A │ │ │Empresa A │ │ │Empresa B │ │ │Empresa A   │ │
│ │──────────│ │ │──────────│ │ │──────────│ │ │────────────│ │
│ │Remessa A │ │ │Remessa B │ │ │Remessa A │ │ │Remessa A   │ │
│ │L001 · 30p│ │ │L002 · 30p│ │ │L003 · 15p│ │ │L004 · 30p  │ │
│ │BC-001 →  │ │ │BC-002 →  │ │ │BC-003 →  │ │ │entregue    │ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └────────────┘ │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## Funcionamento do Leitor de Código de Barras

O scanner simula teclado — digita os caracteres do código e pressiona `Enter`. O frontend mantém um `<input>` sempre focado (via `useRef + useEffect`) que:

1. Captura os caracteres digitados pelo scanner
2. Ao detectar `Enter`, envia `PATCH /api/producao/lotes/barcode/{codigo}/avancar`
3. Exibe feedback visual por 4 segundos:
   - **Verde** → lote avançado com sucesso (ex: "L001 · Costura → Revisão/Conserto")
   - **Vermelho** → código não encontrado ou lote já entregue

---

## Etapas de Fabricação

| Etapa | Código interno |
|-------|---------------|
| Preparo | `preparo` |
| Costura | `costura` |
| Revisão / Conserto | `revisao_conserto` |
| Entregue | `entregue` |

A progressão é sempre linear e não pode ser revertida.

---

## Backend — Endpoint de Avanço por Barcode

```
PATCH /api/producao/lotes/barcode/:codigo/avancar
```

Fluxo interno:
1. `findByCodigoBarras(codigo)` — busca o lote ativo na projeção SQL
2. Valida se a OS está `aberta` ou `em_execucao` e se o lote não está em `entregue`
3. `repo.findById(ordemId)` — reconstrói a OS completa por replay de eventos
4. `ordem.avancarEtapaLote(remessaId, loteId)` — emite evento `EtapaLoteAvancada`
5. `repo.save(ordem)` — grava o evento no event store e atualiza a projeção SQL

Resposta:
```json
{
  "identificador": "L001",
  "ordemNumero": "OS-2026-0001",
  "remessaNome": "Remessa A",
  "etapaAnterior": "costura",
  "etapaAtual": "revisao_conserto",
  "etapaAnteriorLabel": "Costura",
  "etapaAtualLabel": "Revisão/Conserto"
}
```

---

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| PATCH | `/producao/lotes/barcode/:codigo/avancar` | Avançar etapa por código de barras |
| PATCH | `/producao/ordens/:id/remessas/:remessaId/lotes/:loteId/avancar` | Avançar manualmente |

---

Ver [[Módulos/Ordens de Serviço]] para o domínio completo de OS, Remessas e Lotes.
