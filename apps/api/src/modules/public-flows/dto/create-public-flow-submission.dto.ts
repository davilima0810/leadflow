import { Type } from "class-transformer";
import {
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
  @ValidateNested({ each: true })
  @Type(() => PublicFlowSubmissionAnswerDto)
  answers!: PublicFlowSubmissionAnswerDto[];
}
