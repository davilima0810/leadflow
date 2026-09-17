import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsUUID,
  ValidateNested
} from "class-validator";

export type PublicAnswerValue = string | number | boolean | string[];

export class PublicFlowSubmissionAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsNotEmpty()
  value!: PublicAnswerValue;
}

export class CreatePublicFlowSubmissionDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PublicFlowSubmissionAnswerDto)
  answers!: PublicFlowSubmissionAnswerDto[];
}
