import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, MovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CreateEntryDto } from './dto/create-entry.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async entry(userId: string, dto: CreateMovementDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!product) {
        throw new NotFoundException('Produto nao encontrado');
      }
      const updated = await tx.product.update({
        where: { id: product.id },
        data: { quantity: product.quantity + dto.quantity },
      });
      const movement = await tx.movement.create({
        data: {
          productId: product.id,
          userId,
          type: 'IN',
          quantity: dto.quantity,
          supplierId: dto.supplierId ?? null,
        },
      });
      return { product: updated, movement };
    });
  }

  async entryNewItem(userId: string, dto: CreateEntryDto) {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const horaInclu = now.toTimeString().slice(0, 5);

      const product = await tx.product.create({
        data: {
          name: dto.name,
          manufacturer: dto.manufacturer ?? null,
          model: dto.model ?? null,
          nfe: dto.nfe ?? null,
          dtNfe: dto.dtNfe ? new Date(dto.dtNfe) : null,
          dtInclu: now,
          horaInclu,
          quantity: dto.quantity,
          nchagpc: dto.nchagpc ?? null,
          sector: dto.sector ?? null,
          unit: dto.unit ?? null,
        },
      });

      const movement = await tx.movement.create({
        data: {
          productId: product.id,
          userId,
          type: 'IN',
          quantity: dto.quantity,
          supplierId: dto.supplierId ?? null,
        },
      });

      return { product, movement };
    });
  }

  async exit(userId: string, dto: CreateMovementDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!product) {
        throw new NotFoundException('Produto nao encontrado');
      }

      // Enforce maximum quantity per exit operation
      if (dto.quantity > 5) {
        throw new BadRequestException('Quantidade máxima por saída é 5 unidades');
      }

      // Require unitId and sectorId for exits
      if (!dto.unitId || !dto.sectorId) {
        throw new BadRequestException('Unidade e setor sao obrigatorios para saida');
      }

      // Validate unit and sector existence and relation
      const unit = await tx.unit.findUnique({ where: { id: dto.unitId } });
      if (!unit) {
        throw new NotFoundException('Unidade nao encontrada');
      }
      const sector = await tx.sector.findFirst({ where: { id: dto.sectorId, unitId: dto.unitId } });
      if (!sector) {
        throw new NotFoundException('Setor nao encontrado para essa unidade');
      }

      if (product.quantity < dto.quantity) {
        throw new BadRequestException('Estoque insuficiente');
      }
      const updated = await tx.product.update({
        where: { id: product.id },
        data: {
          quantity: product.quantity - dto.quantity,
          nchagpc: dto.nchagpc ?? product.nchagpc,
          sector: sector.name,
          unit: unit.name,
        },
      });
      const movement = await tx.movement.create({
        data: {
          productId: product.id,
          userId,
          type: 'OUT',
          quantity: dto.quantity,
          supplierId: dto.supplierId ?? null,
        },
      });
      return { product: updated, movement };
    });
  }

  async listMovements(options?: {
    limit?: number;
    type?: MovementType;
    from?: Date;
    to?: Date;
  }) {
    const where: Prisma.MovementWhereInput = {};
    if (options?.type) {
      where.type = options.type;
    }
    if (options?.from || options?.to) {
      where.createdAt = {};
      if (options?.from) {
        where.createdAt.gte = options.from;
      }
      if (options?.to) {
        where.createdAt.lte = options.to;
      }
    }
    return this.prisma.movement.findMany({
      take: options?.limit ?? 20,
      orderBy: { createdAt: 'desc' },
      where,
      include: {
        product: {
          select: {
            code: true,
            name: true,
            manufacturer: true,
            model: true,
            nfe: true,
            dtNfe: true,
            dtInclu: true,
            horaInclu: true,
            nchagpc: true,
            sector: true,
            unit: true,
          },
        },
        user: { select: { name: true, email: true, matricula: true } },
      },
    });
  }

  async summary(period: 'day' | 'week' | 'month' | 'year', from?: Date, to?: Date) {
    const end = to ?? new Date();
    const start = from ?? this.getDefaultStart(period, end);

    const rows = await this.prisma.$queryRaw<
      { bucket: Date; in_qty: bigint; out_qty: bigint }[]
    >(Prisma.sql`
      select
        date_trunc(${period}, "createdAt") as bucket,
        coalesce(sum(case when type = 'IN' then quantity else 0 end), 0) as in_qty,
        coalesce(sum(case when type = 'OUT' then quantity else 0 end), 0) as out_qty
      from "Movement"
      where "createdAt" between ${start} and ${end}
      group by bucket
      order by bucket asc;
    `);

    return rows.map((row) => ({
      bucket: row.bucket.toISOString(),
      inQty: Number(row.in_qty),
      outQty: Number(row.out_qty),
    }));
  }

  private getDefaultStart(period: 'day' | 'week' | 'month' | 'year', end: Date) {
    const start = new Date(end);
    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 29);
        break;
      case 'week':
        start.setDate(start.getDate() - 7 * 11);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 11);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 4);
        break;
      default:
        start.setDate(start.getDate() - 29);
    }
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
