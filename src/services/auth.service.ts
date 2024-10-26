import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user';
import { IUser } from 'src/schemas/interfaces/user.interface';
import { IRole } from 'src/schemas/interfaces/role.interface';
import { SessionDocument } from 'src/schemas/session';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    @InjectModel('Session')
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: IUser, currentTenantId?: string): Promise<any> {
    let currentTenantRole = user.tenantRoles[0];
    if (currentTenantId) {
      currentTenantRole = user.tenantRoles.find(
        (tr) => tr.tenant._id.toString() === currentTenantId,
      );
    }

    if (!currentTenantRole) {
      throw new ForbiddenException('No role found for the specified tenant.');
    }
    const { createdAt, updatedAt, ...role } = currentTenantRole.role as IRole;
    const payload = {
      email: user.email,
      sub: user._id,
      name: user.name,
      currentTenant: {
        tenantId: currentTenantRole.tenant._id,
        role: currentTenantRole.role,
      },
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      payload,
      { expiresIn: '7d' },
    );

    await this.createSession(user._id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const session = await this.sessionModel.findOne({ userId, refreshToken });
    if (!session) {
      throw new ForbiddenException('Invalid refresh token');
    }
    session.deleteOne();
  }

  async refreshTokens(refreshToken: string): Promise<any> {
    const decoded = this.jwtService.verify(refreshToken) as {
      sub: string;
      email: string;
      name: string;
      currentTenant: {
        tenantId: string;
        role: string;
      };
    };

    const session = await this.sessionModel.findOne({ userId: decoded.sub, refreshToken });
    if (!session) {
      throw new ForbiddenException('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      throw new ForbiddenException('Refresh token expired');
    }

    const payload = {
      email: decoded.email,
      sub: decoded.sub,
      name: decoded.name,
      currentTenant: decoded.currentTenant,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date();
    session.expiresAt.setDate(session.expiresAt.getDate() + 7);

    await session.save();

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  private async findByEmail(email: string): Promise<IUser> {
    const user = await this.userModel
      .findOne({ email })
      .populate({
        path: 'tenantRoles.role',
        model: 'Role',
      })
      .populate({
        path: 'tenantRoles.tenant',
        model: 'Tenant',
      })
      .exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user.toObject() as IUser;
  }

  private async createSession(
    userId: unknown,
    refreshToken: string,
  ): Promise<SessionDocument> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = new this.sessionModel({
      userId,
      refreshToken,
      expiresAt,
    });

    return session.save();
  }
}
