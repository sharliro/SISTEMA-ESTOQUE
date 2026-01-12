import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength, Matches } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  nfe?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato AAAA-MM-DD' })
  @IsDateString()
  dtNfe?: string;

  @IsOptional()
  @IsDateString()
  dtInclu?: string;

  @IsOptional()
  @IsString()
  horaInclu?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  nchagpc?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  unit?: string;
}
