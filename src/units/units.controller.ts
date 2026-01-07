import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('units')
export class UnitsController {
  constructor(private unitsService: UnitsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  list() {
    return this.unitsService.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateUnitDto) {
    return this.unitsService.createUnit(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.updateUnit(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unitsService.deleteUnit(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/sectors')
  createSector(@Param('id') id: string, @Body() dto: CreateSectorDto) {
    return this.unitsService.createSector(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/sectors/:sectorId')
  updateSector(
    @Param('id') id: string,
    @Param('sectorId') sectorId: string,
    @Body() dto: UpdateSectorDto,
  ) {
    return this.unitsService.updateSector(id, sectorId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id/sectors/:sectorId')
  removeSector(@Param('id') id: string, @Param('sectorId') sectorId: string) {
    return this.unitsService.deleteSector(id, sectorId);
  }
}
