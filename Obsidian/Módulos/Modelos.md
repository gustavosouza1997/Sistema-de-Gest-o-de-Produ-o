# Submódulo — Modelos de Calçados

Parte de [[Módulos/Produção]].

## Responsabilidade

Catálogo de modelos de calçados. É o ponto de partida do domínio de produção: toda Ordem de Serviço parte de um Modelo.

---

## Entidade de Domínio

```typescript
// producao-service/src/modelos/domain/Modelo.ts

interface CriarModeloProps {
  empresaId: string;
  codigo: string;
  nome: string;
  categoria: CategoriaCalcado;
  material?: string;
  descricao?: string;
}

type CategoriaCalcado = 'tenis' | 'sandalia' | 'bota' | 'sapato' | 'chinelo';

class Modelo {
  readonly id: string;
  readonly empresaId: string;
  readonly codigo: string;       // único por empresa
  readonly nome: string;
  readonly categoria: CategoriaCalcado;
  readonly material?: string;
  readonly descricao?: string;
  readonly ativo: boolean;
  readonly criadoEm: Date;

  static criar(props: CriarModeloProps): Modelo { ... }
  desativar(): Modelo { ... }
}
```

---

## Atributos

| Atributo | Tipo | Regra |
|----------|------|-------|
| id | UUID | gerado automaticamente |
| empresaId | UUID | empresa à qual pertence |
| codigo | string | único por empresa |
| nome | string | obrigatório |
| categoria | enum | tênis, sandália, bota, sapato, chinelo |
| material | string | opcional (ex: couro, sintético, borracha) |
| descricao | text | opcional |
| ativo | boolean | modelos inativos não aceitam novas ordens |

---

## Regras de Negócio

- `codigo` deve ser único dentro da mesma empresa
- Não é possível desativar um modelo com ordens de serviço **abertas ou em andamento**
- Modelos inativos não podem originar novas ordens de serviço
- A empresa referenciada em `empresaId` deve existir (validar via read model local)

---

## Commands

| Command | Descrição |
|---------|-----------|
| `CriarModeloCommand` | Cria um novo modelo |
| `AtualizarModeloCommand` | Atualiza nome, categoria, material, descrição |
| `DesativarModeloCommand` | Marca modelo como inativo |

## Queries

| Query | Descrição |
|-------|-----------|
| `ListarModelosQuery` | Lista modelos com filtros (empresa, categoria, ativo) |
| `BuscarModeloPorIdQuery` | Busca modelo pelo ID |
| `BuscarModeloPorCodigoQuery` | Busca modelo pelo código dentro de uma empresa |

---

## Eventos de Domínio

| Evento | Disparado quando |
|--------|-----------------|
| `ModeloCriado` | Modelo criado com sucesso |
| `ModeloAtualizado` | Atributos alterados |
| `ModeloDesativado` | Modelo desativado |

---

## API Endpoints

| Método | Rota | Command/Query |
|--------|------|---------------|
| GET | `/producao/modelos` | `ListarModelosQuery` |
| GET | `/producao/modelos/:id` | `BuscarModeloPorIdQuery` |
| POST | `/producao/modelos` | `CriarModeloCommand` |
| PUT | `/producao/modelos/:id` | `AtualizarModeloCommand` |
| DELETE | `/producao/modelos/:id` | `DesativarModeloCommand` |

---

Ver [[Módulos/Ordens de Serviço]] para como os modelos se relacionam com as ordens.
