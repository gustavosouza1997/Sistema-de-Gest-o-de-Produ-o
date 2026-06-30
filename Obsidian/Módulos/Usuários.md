# Módulo — Usuários

## Responsabilidade

Gerenciar identidade e acesso dos usuários do sistema. A autenticação e emissão de tokens é delegada ao **Authentik** (instância local). O sistema consome os tokens JWT emitidos pelo Authentik para identificar e autorizar usuários.

---

## Authentik como Identity Provider (IdP)

```
  Usuário
     │
     ▼
┌──────────┐   OIDC/OAuth2   ┌───────────────┐
│ Frontend │ ◄─────────────► │   Authentik   │
│ (React)  │                 │  (local :9000) │
└────┬─────┘                 └───────────────┘
     │ Bearer JWT
     ▼
┌──────────────┐
│ API Gateway  │  valida token via JWKS endpoint do Authentik
└──────┬───────┘
       │ user_id + roles extraídos do token
       ▼
  Microserviços
```

**O sistema nunca armazena senhas.** O Authentik é a fonte de verdade de identidade.

---

## Fluxo de Autenticação (OIDC Authorization Code Flow)

1. Usuário acessa o frontend
2. Frontend redireciona para `http://authentik:9000/application/o/calcados-padilha/`
3. Usuário faz login no Authentik
4. Authentik redireciona de volta com `code`
5. Frontend troca o `code` por `access_token` (JWT) e `refresh_token`
6. Frontend envia `Authorization: Bearer <access_token>` em todas as requisições
7. API Gateway valida o JWT contra o JWKS público do Authentik
8. Claims do token (`sub`, `groups`, `email`) são repassados aos serviços

---

## Perfis de Acesso (Roles)

Definidos no Authentik via Groups:

| Role | Permissões |
|------|-----------|
| `admin` | Acesso total ao sistema |
| `gerente` | Visualizar e gerenciar produção, ordens e modelos |
| `operador` | Visualizar e atualizar controle de produção |
| `visualizador` | Somente leitura |

---

## Validação de Token no API Gateway

```typescript
// api-gateway/src/auth/jwt.middleware.ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('http://authentik:9000/application/o/calcados-padilha/jwks/')
);

export async function validateToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: 'http://authentik:9000/application/o/calcados-padilha/',
  });
  return payload; // { sub, email, groups, ... }
}
```

---

## Contexto de Usuário nos Serviços

O API Gateway extrai o contexto do token e o repassa via headers internos:

```
X-User-Id: <sub do JWT>
X-User-Email: usuario@empresa.com
X-User-Roles: admin,gerente
```

Os serviços confiam nesses headers (tráfego interno apenas).

---

## Perfil Local (opcional)

Se necessário armazenar dados adicionais por usuário (preferências, última atividade), cada serviço pode ter uma tabela `user_profiles` vinculada ao `user_id` do Authentik, sem duplicar dados de identidade.

---

## Docker Compose — Authentik

```yaml
services:
  authentik-server:
    image: ghcr.io/goauthentik/server:latest
    command: server
    environment:
      AUTHENTIK_REDIS__HOST: redis
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: authentik
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_SECRET_KEY: troque-por-uma-chave-segura
    ports:
      - "9000:9000"
    depends_on:
      - postgresql
      - redis

  authentik-worker:
    image: ghcr.io/goauthentik/server:latest
    command: worker
    environment:
      AUTHENTIK_REDIS__HOST: redis
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: authentik
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_SECRET_KEY: troque-por-uma-chave-segura
    depends_on:
      - postgresql
      - redis
```

---

Ver [[ADRs/ADR-007 — Authentik como IdP]] para a decisão de usar Authentik.  
Ver [[Arquitetura]] para posição do Authentik no diagrama geral.
