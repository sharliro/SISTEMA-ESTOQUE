import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { UnitsModule } from './units/units.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ProductsModule, StockModule, UnitsModule],
})
export class AppModule {}
