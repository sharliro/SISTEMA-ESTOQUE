import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { MovementType } from '@prisma/client';
import { StockService } from './stock.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @UseGuards(JwtAuthGuard)
  @Post('entry/new')
  entryNew(@Request() req: { user: { id: string } }, @Body() dto: CreateEntryDto) {
    return this.stockService.entryNewItem(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('entry')
  entry(@Request() req: { user: { id: string } }, @Body() dto: CreateMovementDto) {
    return this.stockService.entry(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('exit')
  exit(@Request() req: { user: { id: string } }, @Body() dto: CreateMovementDto) {
    return this.stockService.exit(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('movements')
  list(
    @Query('limit') limit?: string,
    @Query('type') type?: MovementType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const parsed = limit ? Number(limit) : 20;
    const parsedFrom = from ? new Date(from) : undefined;
    const parsedTo = to ? new Date(to) : undefined;
    return this.stockService.listMovements({
      limit: Number.isNaN(parsed) ? 20 : parsed,
      type,
      from: parsedFrom && !Number.isNaN(parsedFrom.valueOf()) ? parsedFrom : undefined,
      to: parsedTo && !Number.isNaN(parsedTo.valueOf()) ? parsedTo : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  summary(
    @Query('period') period?: 'day' | 'week' | 'month' | 'year',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const safePeriod = period && ['day', 'week', 'month', 'year'].includes(period)
      ? period
      : 'day';
    const parsedFrom = from ? new Date(from) : undefined;
    const parsedTo = to ? new Date(to) : undefined;
    return this.stockService.summary(
      safePeriod,
      parsedFrom && !Number.isNaN(parsedFrom.valueOf()) ? parsedFrom : undefined,
      parsedTo && !Number.isNaN(parsedTo.valueOf()) ? parsedTo : undefined,
    );
  }
}
