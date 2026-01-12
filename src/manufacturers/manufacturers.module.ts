import { Module } from '@nestjs/common';
import { ManufacturersController } from './manufacturers.controller';
import { ManufacturersService } from './manufacturers.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ManufacturersController],
  providers: [ManufacturersService],
})
export class ManufacturersModule {}
