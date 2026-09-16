import { Module } from "@nestjs/common";
import { LeadPresenterService } from "./lead-presenter.service";
import { LeadRepository } from "./lead.repository";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadRepository, LeadPresenterService]
})
export class LeadsModule {}
