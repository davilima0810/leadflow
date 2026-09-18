import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UseInterceptors } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CreateQuestionDto } from "../questions/dto/create-question.dto";
import { ReorderQuestionsDto } from "../questions/dto/reorder-questions.dto";
import { UpdateQuestionDto } from "../questions/dto/update-question.dto";
import { CreateFlowDto } from "./dto/create-flow.dto";
import { UpdateFlowDto } from "./dto/update-flow.dto";
import { FlowsService } from "./flows.service";
import type { UploadedImageFile } from "./types/uploaded-image-file";

@Controller("flows")
@UseGuards(JwtAuthGuard)
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post()
  create(@Body() dto: CreateFlowDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.flowsService.create(dto, currentUser);
  }

  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.flowsService.list(currentUser);
  }

  @Get(":id")
  get(@Param("id") id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.flowsService.get(id, currentUser);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateFlowDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.update(id, dto, currentUser);
  }

  @Patch(":id/publish")
  publish(
    @Param("id") id: string,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.publish(id, currentUser);
  }

  @Patch(":id/unpublish")
  unpublish(
    @Param("id") id: string,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.unpublish(id, currentUser);
  }

  @Post(":id/logo")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadLogo(
    @Param("id") id: string,
    @UploadedFile() file: UploadedImageFile | undefined,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.uploadLogo(id, file, currentUser);
  }

  @Delete(":id/logo")
  removeLogo(
    @Param("id") id: string,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.removeLogo(id, currentUser);
  }

  @Post(":id/background")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadBackground(
    @Param("id") id: string,
    @UploadedFile() file: UploadedImageFile | undefined,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.uploadBackground(id, file, currentUser);
  }

  @Delete(":id/background")
  removeBackground(
    @Param("id") id: string,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.removeBackground(id, currentUser);
  }

  @Post(":flowId/questions")
  addQuestion(
    @Param("flowId") flowId: string,
    @Body() dto: CreateQuestionDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.addQuestion(flowId, dto, currentUser);
  }

  @Patch(":flowId/questions/reorder")
  reorderQuestions(
    @Param("flowId") flowId: string,
    @Body() dto: ReorderQuestionsDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.reorderQuestions(flowId, dto, currentUser);
  }

  @Patch(":flowId/questions/:questionId")
  updateQuestion(
    @Param("flowId") flowId: string,
    @Param("questionId") questionId: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.updateQuestion(flowId, questionId, dto, currentUser);
  }

  @Delete(":flowId/questions/:questionId")
  removeQuestion(
    @Param("flowId") flowId: string,
    @Param("questionId") questionId: string,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.flowsService.removeQuestion(flowId, questionId, currentUser);
  }
}
