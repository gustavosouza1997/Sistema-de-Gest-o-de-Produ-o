import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: ConfigService) {
    this.jwks = createRemoteJWKSet(
      new URL(config.getOrThrow('AUTHENTIK_JWKS_URL')),
    );
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.slice(7);

    // Aceitar tanto o issuer externo (localhost) quanto o interno (authentik-server)
    const issuer = this.config.getOrThrow('AUTHENTIK_ISSUER');
    const issuers = [issuer, issuer.replace('localhost:9000', 'authentik-server:9000')];

    try {
      const { payload } = await jwtVerify(token, this.jwks, { issuer: issuers });

      this.propagateUserContext(req, payload);
      next();
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private propagateUserContext(req: Request, payload: JWTPayload) {
    req.headers['x-user-id'] = payload.sub ?? '';
    req.headers['x-user-email'] = (payload['email'] as string) ?? '';
    const groups = (payload['groups'] as string[]) ?? [];
    req.headers['x-user-roles'] = groups.join(',');
  }
}
