import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { QuestionType } from "@prisma/client";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma.service";

type AuthSession = {
  accessToken: string;
  companyId: string;
};

describe("LeadsController", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const createdCompanyIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );

    prisma = moduleRef.get(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.lead.deleteMany({
      where: {
        companyId: {
          in: createdCompanyIds
        }
      }
    });
    await prisma.flow.deleteMany({
      where: {
        companyId: {
          in: createdCompanyIds
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        companyId: {
          in: createdCompanyIds
        }
      }
    });
    await prisma.company.deleteMany({
      where: {
        id: {
          in: createdCompanyIds
        }
      }
    });

    await app.close();
  });

  async function createSession(label: string, whatsappPhone?: string) {
    const response = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        companyName: `Lead Company ${label}`,
        companySlug: `lead-company-${label}-${testRunId}`,
        name: `Lead User ${label}`,
        email: `lead-user-${label}-${testRunId}@example.com`,
        password: "secure-password",
        whatsappPhone
      })
      .expect(201);

    createdCompanyIds.push(response.body.company.id);

    return {
      accessToken: response.body.accessToken,
      companyId: response.body.company.id
    };
  }

  async function createLead(session: AuthSession, label: string) {
    const flow = await prisma.flow.create({
      data: {
        companyId: session.companyId,
        name: `Aluguel ${label}`,
        slug: `aluguel-${label}-${testRunId}`,
        status: "PUBLISHED",
        questions: {
          create: [
            {
              label: "Qual seu nome?",
              type: "TEXT",
              semanticType: "CONTACT_NAME",
              required: true,
              position: 1
            },
            {
              label: "Qual seu WhatsApp?",
              type: "PHONE",
              semanticType: "CONTACT_PHONE",
              required: true,
              position: 2
            },
            {
              label: "Qual seu email?",
              type: "EMAIL",
              semanticType: "CONTACT_EMAIL",
              required: false,
              position: 3
            },
            {
              label: "Qual veículo deseja?",
              type: "SINGLE_CHOICE",
              required: true,
              position: 4,
              options: {
                create: [
                  { label: "Carro", value: "carro", position: 1 },
                  { label: "Moto", value: "moto", position: 2 }
                ]
              }
            },
            {
              label: "Quais extras?",
              type: "MULTIPLE_CHOICE",
              required: false,
              position: 5,
              options: {
                create: [
                  { label: "Seguro", value: "seguro", position: 1 },
                  { label: "Cadeira infantil", value: "cadeira", position: 2 }
                ]
              }
            }
          ]
        }
      },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: {
            position: "asc"
          }
        }
      }
    });

    const lead = await prisma.lead.create({
      data: {
        companyId: session.companyId,
        flowId: flow.id,
        answers: {
          create: [
            {
              questionId: flow.questions[4].id,
              value: ["seguro", "cadeira"]
            },
            {
              questionId: flow.questions[0].id,
              value: "Davi"
            },
            {
              questionId: flow.questions[1].id,
              value: "+55 (86) 99999-9999"
            },
            {
              questionId: flow.questions[2].id,
              value: "davi@example.com"
            },
            {
              questionId: flow.questions[3].id,
              value: "carro"
            }
          ]
        }
      }
    });

    return { flow, lead };
  }

  it("requires JWT for private lead routes", async () => {
    await request(app.getHttpServer()).get("/api/leads").expect(401);
    await request(app.getHttpServer())
      .get(`/api/leads/00000000-0000-0000-0000-000000000000`)
      .expect(401);
  });

  it("lists only leads from the authenticated company ordered by newest first", async () => {
    const companyA = await createSession("list-a", "5586999999999");
    const companyB = await createSession("list-b", "5586888888888");
    const older = await createLead(companyA, "older");
    await new Promise((resolve) => setTimeout(resolve, 5));
    const newer = await createLead(companyA, "newer");
    const otherCompanyLead = await createLead(companyB, "other");

    const response = await request(app.getHttpServer())
      .get("/api/leads")
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .expect(200);

    const ids = response.body.map((lead: { id: string }) => lead.id);

    expect(ids).toEqual([newer.lead.id, older.lead.id]);
    expect(ids).not.toContain(otherCompanyLead.lead.id);
    expect(JSON.stringify(response.body)).not.toContain("answers");
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });

  it("returns tenant-scoped lead detail with ordered answers, summary and whatsapp URL", async () => {
    const companyA = await createSession("detail-a", "5511999999999");
    const companyB = await createSession("detail-b", "5586888888888");
    const { lead } = await createLead(companyA, "detail");

    await request(app.getHttpServer())
      .get(`/api/leads/${lead.id}`)
      .set("Authorization", `Bearer ${companyB.accessToken}`)
      .expect(404);

    const response = await request(app.getHttpServer())
      .get(`/api/leads/${lead.id}`)
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: lead.id,
      flow: {
        name: "Aluguel detail"
      }
    });
    expect(
      response.body.answers.map((answer: { type: QuestionType }) => answer.type)
    ).toEqual(["TEXT", "PHONE", "EMAIL", "SINGLE_CHOICE", "MULTIPLE_CHOICE"]);
    expect(response.body.contact).toEqual({
      name: "Davi",
      phone: "+55 (86) 99999-9999",
      email: "davi@example.com"
    });
    expect(response.body.answers[3].displayValue).toBe("Carro");
    expect(response.body.answers[4].displayValue).toEqual([
      "Seguro",
      "Cadeira infantil"
    ]);
    expect(response.body.summary).toContain("Aluguel detail");
    expect(response.body.summary).toContain("Qual seu nome?");
    expect(response.body.summary).toContain("Davi");
    expect(response.body.whatsappUrl).toContain("https://wa.me/5586999999999");
    expect(decodeURIComponent(response.body.whatsappUrl)).toContain(
      "Olá, Davi! Tudo bem?"
    );
    expect(response.body.whatsappUrl).not.toContain("5511999999999");
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });

  it("returns null contact fields and no whatsapp URL when lead has no semantic contact fields", async () => {
    const company = await createSession("no-semantic", "5586999999999");
    const flow = await prisma.flow.create({
      data: {
        companyId: company.companyId,
        name: "Sem campos semânticos",
        slug: `no-semantic-${testRunId}`,
        status: "PUBLISHED",
        questions: {
          create: [
            {
              label: "Observação",
              type: "TEXT",
              required: true,
              position: 1
            }
          ]
        }
      },
      include: {
        questions: true
      }
    });
    const lead = await prisma.lead.create({
      data: {
        companyId: company.companyId,
        flowId: flow.id,
        answers: {
          create: {
            questionId: flow.questions[0].id,
            value: "Sem telefone"
          }
        }
      }
    });

    const response = await request(app.getHttpServer())
      .get(`/api/leads/${lead.id}`)
      .set("Authorization", `Bearer ${company.accessToken}`)
      .expect(200);

    expect(response.body.whatsappUrl).toBeNull();
    expect(response.body.contact).toEqual({
      name: null,
      phone: null,
      email: null
    });
    expect(response.body.summary).toContain("Gerado pelo LeadFlow.");
  });
});
