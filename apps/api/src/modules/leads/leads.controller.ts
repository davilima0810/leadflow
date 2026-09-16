import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { LeadsService } from "./leads.service";

@Controller("leads")
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.leadsService.list(currentUser);
  }

  @Get(":id")
  get(@Param("id") id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.leadsService.get(id, currentUser);
  }
}
