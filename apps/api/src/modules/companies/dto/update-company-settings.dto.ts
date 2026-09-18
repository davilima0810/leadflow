import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsappPhone?: string | null;
}
