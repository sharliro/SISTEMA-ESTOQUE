import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.supplier.delete({ where: { id } });
  }
}