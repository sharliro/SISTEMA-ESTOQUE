import { IsString, MinLength } from 'class-validator';

export class UpdateSectorDto {
  @IsString()
  @MinLength(1)
  name!: string;
}
