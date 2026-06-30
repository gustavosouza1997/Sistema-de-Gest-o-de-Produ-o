# Processos

## Descrição

Representa um processo vinculado a um [[Modelos de Calçados|modelo de calçado]]. Permite rastrear etapas de produção, aprovação, revisão ou qualquer fluxo de trabalho.

## Atributos

| Campo | Obrigatório | Regra |
|-------|-------------|-------|
| Nome | Sim | — |
| Descrição | Não | — |
| Status | Sim | pendente / em_andamento / concluido |
| Responsável | Não | Nome ou referência ao usuário |
| Data início | Não | — |
| Data fim | Não | Deve ser >= data início |
| Modelo | Sim | FK para `modelos` |

## Status do Processo

```
[pendente] ──► [em_andamento] ──► [concluido]
                     │
                     └──► [cancelado]
```

## Funcionalidades

- [ ] Listar processos (filtrar por modelo, status, responsável)
- [ ] Criar novo processo para um modelo
- [ ] Atualizar status do processo
- [ ] Editar processo
- [ ] Excluir processo (somente pendentes)

## Regras de Negócio

- Um modelo pode ter múltiplos processos simultâneos
- Processos concluídos não podem ser editados
- A data de fim não pode ser anterior à data de início

## API

Ver endpoints em [[API#Processos]]
