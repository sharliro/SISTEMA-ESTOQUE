import { IsInt, IsString, Min, IsOptional, Max } from 'class-validator';

export class CreateMovementDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  quantity!: number;

  @IsOptional()
  @IsString()
  nchagpc?: string;

  // Optional names (kept for backward compatibility)
  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  // New: send unitId and sectorId when performing a Saída
  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  sectorId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
} 
