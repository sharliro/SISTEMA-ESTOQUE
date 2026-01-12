import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';

@Injectable()
export class ManufacturersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateManufacturerDto) {
    // Check if manufacturer already exists
    const existing = await this.prisma.manufacturer.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException('Fabricante já cadastrado');
    }

    return this.prisma.manufacturer.create({
      data: {
        name: dto.name,
        contact: dto.contact ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
      },
    });
  }

  async list() {
    return this.prisma.manufacturer.findMany({ orderBy: { name: 'asc' } });
  }

  async getById(id: string) {
    const manufacturer = await this.prisma.manufacturer.findUnique({ where: { id } });
    if (!manufacturer) {
      throw new NotFoundException('Fabricante não encontrado');
    }
    return manufacturer;
  }

  async update(id: string, dto: UpdateManufacturerDto) {
    await this.getById(id);

    // Check if name is being changed and if it conflicts
    if (dto.name) {
      const existing = await this.prisma.manufacturer.findFirst({
        where: {
          name: { equals: dto.name, mode: 'insensitive' },
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Já existe um fabricante com este nome');
      }
    }

    return this.prisma.manufacturer.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        contact: dto.contact ?? undefined,
        email: dto.email ?? undefined,
        phone: dto.phone ?? undefined,
        address: dto.address ?? undefined,
      },
    });
  }

  async delete(id: string) {
    await this.getById(id);
    return this.prisma.manufacturer.delete({ where: { id } });
  }
}
