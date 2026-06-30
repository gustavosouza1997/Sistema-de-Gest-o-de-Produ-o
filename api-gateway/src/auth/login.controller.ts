import {
  Controller, Post, Body, HttpCode,
  UnauthorizedException, InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface LoginDto { username: string; password: string; }

@Controller('api/auth')
export class LoginController {
  private readonly authentikUrl: string;
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly flowSlug = 'ropc-authentication-flow';

  constructor(config: ConfigService) {
    this.authentikUrl = config.get('AUTHENTIK_URL', 'http://authentik-server:9000');
    this.clientId     = config.get('AUTHENTIK_CLIENT_ID', 'calcados-padilha');
    this.redirectUri  = config.get('FRONTEND_URL', 'http://localhost:5173/');
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const base = this.authentikUrl;
    const flowUrl = `${base}/api/v3/flows/executor/${this.flowSlug}/`;

    // ── 1. Iniciar flow ────────────────────────────────────────────────────
    const startRes = await fetch(flowUrl, { headers: { Accept: 'application/json' } });
    let session = this.pickSession(startRes.headers.getSetCookie?.() ?? []);
    if (!session) throw new InternalServerErrorException('Falha ao iniciar autenticação');

    // ── 2. Identificação ───────────────────────────────────────────────────
    const idRes = await fetch(flowUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: session },
      body: JSON.stringify({ uid_field: dto.username }),
    });
    session = this.pickSession(idRes.headers.getSetCookie?.() ?? []) ?? session;

    // ── 3. Senha ───────────────────────────────────────────────────────────
    const passRes = await fetch(flowUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: session },
      body: JSON.stringify({ password: dto.password }),
    });
    session = this.pickSession(passRes.headers.getSetCookie?.() ?? []) ?? session;
    const passData = await passRes.json() as Record<string, unknown>;

    if (passData['component'] !== 'xak-flow-redirect') {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    // ── 3b. Finalizar flow (seguir redirect para consolidar sessão) ─────────
    const flowTo = passData['to'] as string | undefined;
    if (flowTo) {
      const finalUrl = flowTo.startsWith('http') ? flowTo : `${base}${flowTo}`;
      const finalRes = await fetch(finalUrl, {
        headers: { Cookie: session },
        redirect: 'manual',
      });
      session = this.pickSession(finalRes.headers.getSetCookie?.() ?? []) ?? session;
      }

    // ── 4. Obter código OAuth2 ─────────────────────────────────────────────
    const authorizeUrl = new URL(`${base}/application/o/authorize/`);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', this.clientId);
    authorizeUrl.searchParams.set('redirect_uri', this.redirectUri);
    authorizeUrl.searchParams.set('scope', 'openid profile email');
    authorizeUrl.searchParams.set('state', 'gw');

    const authRes = await fetch(authorizeUrl.toString(), {
      headers: { Cookie: session },
      redirect: 'manual',
    });
    session = this.pickSession(authRes.headers.getSetCookie?.() ?? []) ?? session;

    const location = authRes.headers.get('location') ?? '';

    // Se redirecionou para flow de consent, executar via API executor
    const ifFlowMatch = location.match(/\/if\/flow\/([^/?]+)\//);
    if (ifFlowMatch) {
      const consentSlug = ifFlowMatch[1];
      const consentQuery = location.includes('?') ? location.split('?')[1] : '';
      const code = await this.runConsentFlow(base, consentSlug, consentQuery, session);
      if (code) return this.exchangeCodeAndFetchUser(base, code, dto.username);
      throw new InternalServerErrorException('Falha ao obter código de autorização');
    }

    const code = location ? new URL(location, this.redirectUri).searchParams.get('code') : null;
    if (!code) throw new InternalServerErrorException('Falha ao obter código de autorização');

    return this.exchangeCodeAndFetchUser(base, code, dto.username);
  }

  private async runConsentFlow(
    base: string,
    flowSlug: string,
    query: string,
    session: string,
  ): Promise<string | null> {
    const executorUrl = `${base}/api/v3/flows/executor/${flowSlug}/${query ? '?' + query : ''}`;

    // Iniciar o flow de consent com a sessão autenticada
    const startRes = await fetch(executorUrl, {
      headers: { Accept: 'application/json', Cookie: session },
    });
    const newSession = this.pickSession(startRes.headers.getSetCookie?.() ?? []) ?? session;
    const startData = await startRes.json() as Record<string, unknown>;

    // Se já é redirect, extrair code
    if (startData['component'] === 'xak-flow-redirect') {
      const to = startData['to'] as string ?? '';
      const parsedCode = to.includes('?') ? new URL(to.startsWith('http') ? to : `http://x${to}`).searchParams.get('code') : null;
      return parsedCode;
    }

    // Submeter consent (aprovar scopes)
    const submitRes = await fetch(`${base}/api/v3/flows/executor/${flowSlug}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: newSession },
      body: JSON.stringify({ token: startData['token'] }),
    });
    const newSession2 = this.pickSession(submitRes.headers.getSetCookie?.() ?? []) ?? newSession;
    const submitData = await submitRes.json() as Record<string, unknown>;

    if (submitData['component'] === 'xak-flow-redirect') {
      const to = submitData['to'] as string ?? '';
      return new URL(to, this.redirectUri).searchParams.get('code');
    }

    // Tentar GET final no executor para forçar conclusão
    const finalRes = await fetch(`${base}/api/v3/flows/executor/${flowSlug}/`, {
      headers: { Cookie: newSession2 },
      redirect: 'manual',
    });
    const finalLocation = finalRes.headers.get('location') ?? '';
    return finalLocation ? new URL(finalLocation, this.redirectUri).searchParams.get('code') : null;
  }

  private async exchangeCodeAndFetchUser(base: string, code: string, fallbackName: string) {
    // ── 5. Trocar código por token ─────────────────────────────────────────
    const tokenRes = await fetch(`${base}/application/o/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        client_id:    this.clientId,
        redirect_uri: this.redirectUri,
      }),
    });
    const tokenText = await tokenRes.text();
    const tokenData = tokenText ? JSON.parse(tokenText) as Record<string, unknown> : {};
    const accessToken = tokenData['access_token'] as string | undefined;
    if (!accessToken) throw new InternalServerErrorException('Falha ao obter token de acesso');

    // ── 6. Perfil do usuário — tenta userinfo, fallback para claims do id_token ─
    let p: Record<string, unknown> = {};

    const userRes = await fetch(`${base}/application/o/userinfo/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userRes.ok) {
      const userText = await userRes.text();
      p = userText ? JSON.parse(userText) as Record<string, unknown> : {};
    }

    // Se userinfo não retornou dados, decodificar o id_token
    if (!p['sub']) {
      const idToken = tokenData['id_token'] as string | undefined;
      if (idToken) {
        const payload = idToken.split('.')[1];
        p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as Record<string, unknown>;
      }
    }

    return {
      accessToken,
      user: {
        sub:     p['sub'] as string,
        name:    (p['name'] ?? p['preferred_username'] ?? p['given_name'] ?? fallbackName) as string,
        email:   (p['email'] ?? '') as string,
        picture: p['picture'] as string | undefined,
      },
    };
  }

  private pickSession(setCookies: string[]): string | null {
    const sc = setCookies.find((c) => c.startsWith('authentik_session='));
    return sc ? sc.split(';')[0] : null;
  }
}
