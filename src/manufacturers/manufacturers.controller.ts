import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards } from '@nestjs/common';
import { ManufacturersService } from './manufacturers.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('manufacturers')
export class ManufacturersController {
  constructor(private manufacturersService: ManufacturersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateManufacturerDto) {
    return this.manufacturersService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.manufacturersService.list();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.manufacturersService.getById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    return this.manufacturersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.manufacturersService.delete(id);
  }
}
