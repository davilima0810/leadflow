import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";
import { QuestionSemanticType, QuestionType } from "@prisma/client";
import { QuestionOptionDto } from "./question-option.dto";

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsOptional()
  @IsEnum(QuestionSemanticType)
  semanticType?: QuestionSemanticType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsInt()
  @Min(1)
  position!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}
