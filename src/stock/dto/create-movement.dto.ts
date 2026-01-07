import { IsInt, IsString, Min } from 'class-validator';

export class CreateMovementDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
