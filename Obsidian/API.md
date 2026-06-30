# API REST

Base URL: `http://localhost:3000/api`
Autenticação: `Authorization: Bearer {JWT}` (exceto `/auth/login`)

---

## Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login — retorna `{ accessToken }` |

**Body:**
```json
{ "username": "string", "password": "string" }
```

---

## Empresas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresas` | Listar empresas |
| GET | `/empresas/:id` | Buscar empresa |
| POST | `/empresas` | Criar empresa |
| PUT | `/empresas/:id` | Atualizar empresa |
| DELETE | `/empresas/:id` | Desativar empresa |

**POST /empresas — body:**
```json
{ "nome": "string", "cnpj": "string", "telefone": "string?", "email": "string?" }
```

---

## Modelos de Calçados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/producao/modelos` | Listar modelos (query: `empresaId`) |
| GET | `/producao/modelos/:id` | Buscar modelo |
| POST | `/producao/modelos` | Criar modelo |
| PATCH | `/producao/modelos/:id/desativar` | Desativar modelo |
| PATCH | `/producao/modelos/:id/reativar` | Reativar modelo |
| POST | `/producao/modelos/:id/roteiro` | Adicionar operação ao roteiro |
| PATCH | `/producao/modelos/:id/roteiro/:opId` | Editar operação |
| DELETE | `/producao/modelos/:id/roteiro/:opId` | Remover operação |
| POST | `/producao/modelos/:id/referencias` | Adicionar referência |
| PATCH | `/producao/modelos/:id/referencias/:refId` | Editar referência |
| DELETE | `/producao/modelos/:id/referencias/:refId` | Remover referência |
| POST | `/producao/modelos/:id/referencias/:refId/operacoes` | Adicionar op. à referência |
| PATCH | `/producao/modelos/:id/referencias/:refId/operacoes/:opId` | Editar op. |
| DELETE | `/producao/modelos/:id/referencias/:refId/operacoes/:opId` | Remover op. |

---

## Ordens de Serviço

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/producao/ordens` | Criar OS |
| GET | `/producao/ordens` | Listar OS (query: `empresaId`, `status`) |
| GET | `/producao/ordens/:id` | Detalhe completo (remessas + lotes + etapas) |
| PATCH | `/producao/ordens/:id/abrir` | Abrir OS |
| PATCH | `/producao/ordens/:id/iniciar` | Iniciar execução |
| PATCH | `/producao/ordens/:id/concluir` | Concluir OS |
| PATCH | `/producao/ordens/:id/cancelar` | Cancelar OS |

**POST /producao/ordens — body:**
```json
{ "empresaId": "uuid", "notaFiscalOrigem": "string" }
```

**GET /producao/ordens — response item:**
```json
{
  "id": "uuid",
  "empresaId": "uuid",
  "notaFiscalOrigem": "NF-2025-001",
  "numero": "OS-2026-0001",
  "status": "rascunho",
  "totalRemessas": 2,
  "totalPares": 180,
  "criadaEm": "2026-06-29T..."
}
```

---

## Remessas (dentro de uma OS)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/producao/ordens/:id/remessas` | Adicionar remessa |
| DELETE | `/producao/ordens/:id/remessas/:remessaId` | Remover remessa |

**POST body:** `{ "nome": "string" }`

---

## Lotes (dentro de uma Remessa)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/producao/ordens/:id/remessas/:remessaId/lotes` | Adicionar lote |
| PATCH | `/producao/ordens/:id/remessas/:remessaId/lotes/:loteId` | Editar lote |
| DELETE | `/producao/ordens/:id/remessas/:remessaId/lotes/:loteId` | Remover lote |
| PATCH | `/producao/ordens/:id/remessas/:remessaId/lotes/:loteId/avancar` | Avançar etapa |

**POST/PATCH body:**
```json
{
  "identificador": "L001",
  "codigoBarras": "BC-001",
  "modeloId": "uuid",
  "quantidade": 30
}
```

---

## Lotes por Código de Barras

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| PATCH | `/producao/lotes/barcode/:codigo/avancar` | Avançar etapa por barcode |

**Response:**
```json
{
  "identificador": "L001",
  "ordemNumero": "OS-2026-0001",
  "remessaNome": "Remessa A",
  "etapaAnterior": "preparo",
  "etapaAtual": "costura",
  "etapaAnteriorLabel": "Preparo",
  "etapaAtualLabel": "Costura"
}
```

---

## Observabilidade

| Método | Endpoint | Disponível em |
|--------|----------|---------------|
| GET | `/metrics` | Todos os serviços (porta direta) |
| GET | `/health` | api-gateway |
