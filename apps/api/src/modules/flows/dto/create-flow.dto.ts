import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class CreateFlowDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
