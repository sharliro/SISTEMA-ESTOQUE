import { IsString, MinLength } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  @MinLength(1)
  name!: string;
}
