# ADR-007 — Authentik como Identity Provider

**Data:** 2025-06  
**Status:** Aceita

---

## Contexto

O sistema precisa de autenticação (login/logout), autorização (roles/permissões) e gestão de usuários. As opções são: implementar um `auth-service` próprio com JWT, ou delegar para um Identity Provider (IdP) externo.

---

## Alternativas consideradas

| Alternativa | Descrição | Motivo de rejeição |
|-------------|-----------|-------------------|
| **Auth service próprio** | JWT customizado com refresh token, tabela de usuários | Alto custo de segurança: rotação de chaves, revogação, MFA, sessions — tudo por conta |
| **Keycloak** | IdP open-source maduro, OIDC completo | Interface de admin pesada; configuração mais complexa |
| **Authentik** ✅ | IdP moderno, interface limpa, OIDC/OAuth2, local | — |
| **Auth0 / Okta** | SaaS de identidade | Custo em produção; dados de usuários em terceiro |
| **Supabase Auth** | Auth como serviço integrado a banco | Acoplamento ao Supabase; muda a decisão de banco |

---

## Decisão

Usar **Authentik** como Identity Provider local:

- Roda como container Docker na infraestrutura local
- Emite tokens JWT assinados via **OIDC Authorization Code Flow**
- Gerencia usuários, grupos (roles) e sessões
- Os microserviços **validam** o JWT via JWKS endpoint público do Authentik
- **Nenhum microserviço armazena senha** — tudo gerenciado pelo Authentik

### Configuração OIDC no Authentik

- Criar uma **Application** no Authentik para o CalcadosPadilha
- Definir **Groups** como roles: `admin`, `gerente`, `operador`, `visualizador`
- O claim `groups` no JWT carrega as roles do usuário

### Validação no API Gateway

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('http://authentik:9000/application/o/calcados-padilha/jwks/')
);

const { payload } = await jwtVerify(token, JWKS, {
  issuer: 'http://authentik:9000/application/o/calcados-padilha/',
});
// payload.sub = user_id, payload.groups = ['admin']
```

---

## Critérios de decisão

- Segurança: não reinventar autenticação (rotação de chaves, MFA, brute-force protection)
- Autonomia: self-hosted, dados de identidade ficam locais
- OIDC padrão: qualquer lib JOSE/JWT valida sem código customizado
- Interface de admin moderna para gerenciar usuários sem código

---

## Consequências

**Positivas:**
- Zero código de autenticação nos microserviços (apenas validação de token)
- MFA, brute-force protection, sessões e revogação de tokens fora da caixa
- Fácil adicionar login social (Google, GitHub) no futuro via Authentik
- Usuários gerenciados pela UI do Authentik, não por endpoints de API

**Negativas / Trade-offs:**
- Mais um container para manter (Authentik + Redis + PostgreSQL próprio do Authentik)
- O frontend precisa implementar o OIDC Authorization Code Flow (usar `oidc-client-ts`)
- Se o Authentik cair, login fica indisponível (adicionar health check e restart policy)

---

Ver [[Módulos/Usuários]] para o fluxo completo de autenticação e propagação de contexto de usuário.
