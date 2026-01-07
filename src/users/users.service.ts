import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        matricula: dto.matricula ?? null,
        passwordHash,
        role: dto.role ?? 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        matricula: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      matricula: user.matricula,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async list() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        matricula: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, requester: { id: string; email: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    if (user.id === requester.id) {
      throw new ForbiddenException('Nao e permitido remover o proprio usuario');
    }
    if (user.role === 'ADMIN') {
      const mainAdminEmail = process.env.ADMIN_EMAIL;
      if (!mainAdminEmail || requester.email !== mainAdminEmail) {
        throw new ForbiddenException('Somente o admin principal pode remover outros admins');
      }
    }
    return this.prisma.user.delete({ where: { id } });
  }
}
