import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly secretKey: Uint8Array;

  constructor(private readonly config: ConfigService) {
    const secret = config.get('JWT_SECRET', 'dev-secret-mude-em-producao-obrigatorio');
    this.secretKey = new TextEncoder().encode(secret);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.slice(7);

    try {
      const { payload } = await jwtVerify(token, this.secretKey, {
        issuer: 'calcados-padilha-gateway',
      });

      this.propagateUserContext(req, payload);
      next();
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private propagateUserContext(req: Request, payload: JWTPayload) {
    req.headers['x-user-id']    = payload.sub ?? '';
    req.headers['x-user-email'] = (payload['email'] as string) ?? '';
    const groups = (payload['groups'] as string[]) ?? [];
    req.headers['x-user-roles'] = groups.join(',');
  }
}
