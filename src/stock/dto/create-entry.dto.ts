import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  manufacturer!: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsOptional()
  @IsString()
  nfe?: string;

  @IsOptional()
  @IsDateString()
  dtNfe?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  nchagpc?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}
