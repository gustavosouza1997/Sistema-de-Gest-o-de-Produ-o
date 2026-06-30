# Modelos de Calçados

## Descrição

Representa um modelo de calçado cadastrado no sistema, vinculado a uma [[Empresas|empresa]].

## Atributos

| Campo | Obrigatório | Regra |
|-------|-------------|-------|
| Código | Sim | Único por empresa |
| Nome | Sim | — |
| Categoria | Sim | ex: tênis, sandália, bota |
| Material | Não | ex: couro, sintético |
| Empresa | Sim | FK para `empresas` |

## Funcionalidades

- [ ] Listar modelos (com filtros por empresa, categoria)
- [ ] Cadastrar novo modelo
- [ ] Editar modelo existente
- [ ] Desativar/excluir modelo
- [ ] Ver processos vinculados ao modelo → [[Processos]]

## Regras de Negócio

- O código do modelo deve ser único dentro de uma mesma empresa
- Não é possível excluir um modelo que possua processos ativos

## API

Ver endpoints em [[API#Modelos]]
