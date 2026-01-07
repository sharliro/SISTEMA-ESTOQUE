import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        manufacturer: dto.manufacturer ?? null,
        model: dto.model ?? null,
        nfe: dto.nfe ?? null,
        dtNfe: dto.dtNfe ? new Date(dto.dtNfe) : null,
        dtInclu: dto.dtInclu ? new Date(dto.dtInclu) : null,
        horaInclu: dto.horaInclu ?? null,
        quantity: dto.quantity ?? 0,
        nchagpc: dto.nchagpc ?? null,
        sector: dto.sector ?? null,
        unit: dto.unit ?? null,
      },
    });
  }

  async list() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.getById(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        manufacturer: dto.manufacturer ?? undefined,
        model: dto.model ?? undefined,
        nfe: dto.nfe ?? undefined,
        dtNfe: dto.dtNfe ? new Date(dto.dtNfe) : undefined,
        dtInclu: dto.dtInclu ? new Date(dto.dtInclu) : undefined,
        horaInclu: dto.horaInclu ?? undefined,
        nchagpc: dto.nchagpc ?? undefined,
        sector: dto.sector ?? undefined,
        unit: dto.unit ?? undefined,
      },
    });
  }
}
