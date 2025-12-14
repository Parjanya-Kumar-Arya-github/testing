import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../logging/logging.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SessionsService {
  private readonly context = SessionsService.name;
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async createSession(params: {
    userId: string;
    refreshToken: string;
    userAgent?: string | null;
    ip?: string | null;
    expiresAt: Date;
  }) {
    try {
      const hash = await bcrypt.hash(params.refreshToken, 10);
      const s = await this.prisma.session.create({
        data: {
          userId: params.userId,
          refreshTokenHash: hash,
          userAgent: params.userAgent ?? null,
          ip: params.ip ?? null,
          expiresAt: params.expiresAt,
        },
      });
      this.logger.logWithContext(this.context, 'Session created', {
        sessionId: s.id,
        userId: params.userId,
      });
      return s;
    } catch (err) {
      this.logger.errorWithContext(this.context, 'Error creating session', (err as any)?.stack);
      throw new InternalServerErrorException('Failed to create session');
    }
  }

  async findValidSessionsForUser(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSessionById(id: string) {
    try {
      await this.prisma.session.delete({ where: { id } });
    } catch (err) {
      this.logger.warnWithContext(this.context, 'Failed to delete session', { id });
    }
  }

  async deleteSessionsForUser(userId: string) {
    try {
      await this.prisma.session.deleteMany({ where: { userId } });
    } catch (err) {
      this.logger.warnWithContext(this.context, 'Failed to delete sessions for user', { userId });
    }
  }

  async deleteExpiredSessions() {
    try {
      await this.prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
    } catch (err) {
      this.logger.warnWithContext(this.context, 'Failed to cleanup expired sessions');
    }
  }
}
