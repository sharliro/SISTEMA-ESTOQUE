import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.unit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sectors: { orderBy: { name: 'asc' } },
      },
    });
  }

  async createUnit(dto: CreateUnitDto) {
    const existing = await this.prisma.unit.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Unidade ja cadastrada');
    }
    return this.prisma.unit.create({ data: { name: dto.name } });
  }

  async createSector(unitId: string, dto: CreateSectorDto) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new NotFoundException('Unidade nao encontrada');
    }
    const existing = await this.prisma.sector.findFirst({
      where: { unitId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Setor ja cadastrado nessa unidade');
    }
    return this.prisma.sector.create({
      data: {
        name: dto.name,
        unitId,
      },
    });
  }

  async updateUnit(id: string, dto: UpdateUnitDto) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      throw new NotFoundException('Unidade nao encontrada');
    }
    const existing = await this.prisma.unit.findUnique({ where: { name: dto.name } });
    if (existing && existing.id !== id) {
      throw new ConflictException('Unidade ja cadastrada');
    }
    return this.prisma.unit.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async deleteUnit(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      throw new NotFoundException('Unidade nao encontrada');
    }
    const sectorCount = await this.prisma.sector.count({ where: { unitId: id } });
    if (sectorCount > 0) {
      throw new BadRequestException('Remova os setores antes de excluir a unidade');
    }
    return this.prisma.unit.delete({ where: { id } });
  }

  async updateSector(unitId: string, sectorId: string, dto: UpdateSectorDto) {
    const sector = await this.prisma.sector.findFirst({ where: { id: sectorId, unitId } });
    if (!sector) {
      throw new NotFoundException('Setor nao encontrado');
    }
    const existing = await this.prisma.sector.findFirst({
      where: { unitId, name: dto.name },
    });
    if (existing && existing.id !== sectorId) {
      throw new ConflictException('Setor ja cadastrado nessa unidade');
    }
    return this.prisma.sector.update({
      where: { id: sectorId },
      data: { name: dto.name },
    });
  }

  async deleteSector(unitId: string, sectorId: string) {
    const sector = await this.prisma.sector.findFirst({ where: { id: sectorId, unitId } });
    if (!sector) {
      throw new NotFoundException('Setor nao encontrado');
    }
    return this.prisma.sector.delete({ where: { id: sectorId } });
  }
}
