import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IRole } from 'src/schemas/interfaces/role.interface';

export interface jwtPayload {
  email: string;
  userId: string;
  name: string;
  currentTenant: {
    tenantId: string;
    role: IRole;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      currentTenant: payload.currentTenant,
    };
  }
}
