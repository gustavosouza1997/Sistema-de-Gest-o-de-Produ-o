# Empresas

## Descrição

Representa uma empresa cadastrada no sistema. Cada empresa pode ter vários [[Modelos de Calçados|modelos]] vinculados.

## Atributos

| Campo | Obrigatório | Regra |
|-------|-------------|-------|
| Nome | Sim | — |
| CNPJ | Sim | Único no sistema, validado |
| Telefone | Não | — |
| E-mail | Não | Formato válido |

## Funcionalidades

- [ ] Listar empresas
- [ ] Cadastrar nova empresa
- [ ] Editar empresa
- [ ] Ver modelos da empresa → [[Modelos de Calçados]]
- [ ] Desativar empresa

## Regras de Negócio

- CNPJ deve ser único e validado (formato e dígitos verificadores)
- Não é possível desativar uma empresa com modelos/processos ativos

## API

Ver endpoints em [[API#Empresas]]
