import { Test } from "@nestjs/testing";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns ok status", () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      status: "ok"
    });
  });

  it("is registered in the testing module", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController]
    }).compile();

    expect(moduleRef.get(HealthController)).toBeInstanceOf(HealthController);
  });
});
