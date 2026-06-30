import {
  Controller, Post, Body, HttpCode,
  UnauthorizedException, InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';

interface LoginDto { username: string; password: string; }

@Controller('api/auth')
export class LoginController {
  private readonly authentikUrl: string;
  private readonly authentikToken: string;
  private readonly jwtSecret: Uint8Array;
  private readonly flowSlug = 'ropc-authentication-flow';

  constructor(config: ConfigService) {
    this.authentikUrl   = config.get('AUTHENTIK_URL', 'http://authentik-server:9000');
    this.authentikToken = config.get('AUTHENTIK_BOOTSTRAP_TOKEN', 'bootstrap-token-dev');
    const secret        = config.get('JWT_SECRET', 'dev-secret-mude-em-producao-obrigatorio');
    this.jwtSecret      = new TextEncoder().encode(secret);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const base    = this.authentikUrl;
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
    const passData = await passRes.json() as Record<string, unknown>;

    if (passData['component'] !== 'xak-flow-redirect') {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    // ── 4. Buscar dados do usuário via admin API ───────────────────────────
    const userRes = await fetch(
      `${base}/api/v3/core/users/?username=${encodeURIComponent(dto.username)}`,
      { headers: { Authorization: `Bearer ${this.authentikToken}` } },
    );
    if (!userRes.ok) throw new InternalServerErrorException('Falha ao obter dados do usuário');

    const userData = await userRes.json() as { results: Array<Record<string, unknown>> };
    const user = userData.results[0];
    if (!user) throw new InternalServerErrorException('Usuário não encontrado');

    // ── 5. Emitir JWT assinado localmente ─────────────────────────────────
    const accessToken = await new SignJWT({
      sub:                user['uid'] as string,
      email:              (user['email'] as string) ?? '',
      name:               (user['name'] as string) ?? dto.username,
      preferred_username: user['username'] as string,
      groups:             (user['groups_obj'] as unknown[])?.map((g: any) => g.name as string) ?? [],
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setIssuer('calcados-padilha-gateway')
      .sign(this.jwtSecret);

    return {
      accessToken,
      user: {
        sub:     user['uid'] as string,
        name:    (user['name'] as string) ?? dto.username,
        email:   (user['email'] as string) ?? '',
        picture: undefined,
      },
    };
  }

  private pickSession(setCookies: string[]): string | null {
    const sc = setCookies.find((c) => c.startsWith('authentik_session='));
    return sc ? sc.split(';')[0] : null;
  }
}
