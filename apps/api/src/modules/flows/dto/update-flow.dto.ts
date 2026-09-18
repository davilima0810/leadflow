import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength
} from "class-validator";
import { BrandImageDisplay } from "@prisma/client";
import { IsFlowAssetReference } from "../../../common/storage/is-flow-asset-reference.decorator";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export class UpdateFlowDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @IsFlowAssetReference()
  @MaxLength(2048)
  coverImageUrl?: string | null;

  @IsOptional()
  @IsEnum(BrandImageDisplay)
  brandImageDisplay?: BrandImageDisplay;

  @IsOptional()
  @IsString()
  @IsFlowAssetReference()
  @MaxLength(2048)
  backgroundImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_PATTERN)
  primaryColor?: string | null;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_PATTERN)
  backgroundColor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  welcomeMessage?: string | null;

  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(2048)
  externalLinkUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  externalLinkLabel?: string | null;
}
