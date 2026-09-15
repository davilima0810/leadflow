import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class QuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsInt()
  @Min(1)
  position!: number;
}
