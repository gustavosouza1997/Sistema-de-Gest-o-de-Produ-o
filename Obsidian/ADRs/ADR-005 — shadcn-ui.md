# ADR-005 — shadcn/ui para o Frontend

**Data:** 2025-06  
**Status:** Aceita

---

## Contexto

O frontend é uma SPA em React que precisa de componentes de UI consistentes, acessíveis e customizáveis sem depender de uma biblioteca de componentes fechada que possa limitar customização ou criar lock-in.

---

## Alternativas consideradas

| Alternativa | Descrição | Motivo de rejeição |
|-------------|-----------|-------------------|
| **Material UI (MUI)** | Componentes completos, tema Google | Visual opinionado; customização profunda exige override de CSS-in-JS |
| **Ant Design** | Rico em componentes empresariais | Muito opinionado; bundle grande; estilo difícil de customizar |
| **Chakra UI** | Acessível, flexível | Menos components prontos que shadcn; não usa Tailwind |
| **shadcn/ui** ✅ | Componentes copiados para o projeto, Tailwind, Radix primitivos | — |
| **CSS puro / zero dependency** | Máximo controle | Custo de desenvolvimento muito alto |

---

## Decisão

Usar **shadcn/ui** com:
- **React + Vite** como base
- **Tailwind CSS** para estilização
- **Radix UI** como primitivos de acessibilidade (já incluso no shadcn)
- **TypeScript** em todo o frontend

Os componentes do shadcn são **copiados** para `src/components/ui/` — não são uma dependência de npm. Isso significa controle total sobre o código dos componentes.

---

## Critérios de decisão

- Componentes acessíveis por padrão (via Radix primitivos)
- Controle total sobre o visual e comportamento (sem black-box)
- Tailwind permite design system consistente sem CSS global
- Sem lock-in de biblioteca — se um componente não servir, modifica diretamente

---

## Consequências

**Positivas:**
- Componentes são código do projeto — qualquer modificação é imediata
- Tailwind + Radix = acessibilidade + customização sem conflito
- Boa integração com React Hook Form e Zod para formulários
- Comunidade ativa e componentes novos adicionados frequentemente

**Negativas / Trade-offs:**
- Atualizações do shadcn são manuais (não `npm update`)
- Mais arquivos em `src/components/ui/` que precisam de manutenção
- Requer familiaridade com Tailwind CSS para customizações
