import { IsNotEmpty, IsString, Matches } from "class-validator";

export class PublicFlowParamsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  companySlug!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  flowSlug!: string;
}
