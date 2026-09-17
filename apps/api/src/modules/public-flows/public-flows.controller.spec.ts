import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FlowStatus } from "@prisma/client";
import * as argon2 from "argon2";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma.service";

describe("PublicFlowsController", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const createdCompanyIds: string[] = [];
  const createdUserIds: string[] = [];

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
        id: {
          in: createdUserIds
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

  async function createCompany(label: string) {
    const company = await prisma.company.create({
      data: {
        name: `Public Flow Company ${label}`,
        slug: `public-flow-${label}-${testRunId}`,
        whatsappPhone: "5586999999999",
        users: {
          create: {
            name: `Public Flow User ${label}`,
            email: `public-flow-${label}-${testRunId}@example.com`,
            passwordHash: await argon2.hash("secure-password")
          }
        }
      }
    });

    createdCompanyIds.push(company.id);

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: `public-flow-${label}-${testRunId}@example.com`
      }
    });

    createdUserIds.push(user.id);

    return company;
  }

  async function createFlowWithQuestions(
    companyId: string,
    slug: string,
    status: FlowStatus
  ) {
    return prisma.flow.create({
      data: {
        companyId,
        name: "Aluguel de veículos",
        slug,
        description: "Qualificação pública",
        status,
        questions: {
          create: [
            {
              label: "Segunda pergunta",
              type: "TEXT",
              semanticType: "CONTACT_NAME",
              required: false,
              position: 2
            },
            {
              label: "Qual veículo você procura?",
              type: "SINGLE_CHOICE",
              required: true,
              position: 1,
              options: {
                create: [
                  {
                    label: "Moto",
                    value: "moto",
                    position: 2
                  },
                  {
                    label: "Carro",
                    value: "carro",
                    position: 1
                  }
                ]
              }
            }
          ]
        }
      }
    });
  }

  it("returns a published flow publicly without requiring JWT", async () => {
    const company = await createCompany("published");
    const flow = await createFlowWithQuestions(
      company.id,
      `published-${testRunId}`,
      FlowStatus.PUBLISHED
    );

    const response = await request(app.getHttpServer())
      .get(`/api/public-flows/${company.slug}/${flow.slug}`)
      .expect(200);

    expect(response.body).toMatchObject({
      company: {
        name: company.name,
        slug: company.slug
      },
      flow: {
        id: flow.id,
        name: "Aluguel de veículos",
        slug: flow.slug,
        description: "Qualificação pública"
      }
    });
    expect(response.body.flow.questions.map((question: { position: number }) => question.position)).toEqual([
      1,
      2
    ]);
    expect(response.body.flow.questions[1].semanticType).toBe("CONTACT_NAME");
    expect(response.body.flow.questions[0].options.map((option: { position: number }) => option.position)).toEqual([
      1,
      2
    ]);
  });

  it("returns 404 for draft, missing company or missing flow", async () => {
    const company = await createCompany("draft");
    const draftFlow = await createFlowWithQuestions(
      company.id,
      `draft-${testRunId}`,
      FlowStatus.DRAFT
    );

    await request(app.getHttpServer())
      .get(`/api/public-flows/${company.slug}/${draftFlow.slug}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/public-flows/missing-company-${testRunId}/${draftFlow.slug}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/public-flows/${company.slug}/missing-flow-${testRunId}`)
      .expect(404);
  });

  it("resolves the same flow slug correctly for different companies", async () => {
    const firstCompany = await createCompany("same-slug-a");
    const secondCompany = await createCompany("same-slug-b");
    const slug = `same-flow-${testRunId}`;

    const firstFlow = await createFlowWithQuestions(
      firstCompany.id,
      slug,
      FlowStatus.PUBLISHED
    );
    const secondFlow = await createFlowWithQuestions(
      secondCompany.id,
      slug,
      FlowStatus.PUBLISHED
    );

    const firstResponse = await request(app.getHttpServer())
      .get(`/api/public-flows/${firstCompany.slug}/${slug}`)
      .expect(200);
    const secondResponse = await request(app.getHttpServer())
      .get(`/api/public-flows/${secondCompany.slug}/${slug}`)
      .expect(200);

    expect(firstResponse.body.flow.id).toBe(firstFlow.id);
    expect(firstResponse.body.company.slug).toBe(firstCompany.slug);
    expect(secondResponse.body.flow.id).toBe(secondFlow.id);
    expect(secondResponse.body.company.slug).toBe(secondCompany.slug);
  });

  it("does not expose private fields", async () => {
    const company = await createCompany("private-fields");
    const flow = await createFlowWithQuestions(
      company.id,
      `private-fields-${testRunId}`,
      FlowStatus.PUBLISHED
    );

    const response = await request(app.getHttpServer())
      .get(`/api/public-flows/${company.slug}/${flow.slug}`)
      .expect(200);

    const serialized = JSON.stringify(response.body);

    expect(serialized).not.toContain("companyId");
    expect(serialized).not.toContain("whatsappPhone");
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("createdAt");
    expect(serialized).not.toContain("updatedAt");
    expect(serialized).not.toContain("status");
    expect(serialized).not.toContain("email");
  });

  it("rejects invalid slug parameters", async () => {
    await request(app.getHttpServer())
      .get("/api/public-flows/Invalid_Company/flow-ok")
      .expect(400);

    await request(app.getHttpServer())
      .get("/api/public-flows/company-ok/Invalid_Flow")
      .expect(400);
  });

  it("creates a lead submission for a published flow", async () => {
    const company = await createCompany("submission");
    const flow = await createFlowWithQuestions(
      company.id,
      `submission-${testRunId}`,
      FlowStatus.PUBLISHED
    );
    const flowWithQuestions = await prisma.flow.findUniqueOrThrow({
      where: {
        id: flow.id
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
    const choiceQuestion = flowWithQuestions.questions[0];
    const textQuestion = flowWithQuestions.questions[1];

    const response = await request(app.getHttpServer())
      .post(`/api/public-flows/${company.slug}/${flow.slug}/submissions`)
      .send({
        answers: [
          {
            questionId: choiceQuestion.id,
            value: "carro"
          },
          {
            questionId: textQuestion.id,
            value: "Observação livre"
          }
        ]
      })
      .expect(201);

    expect(response.body).toMatchObject({
      status: "created"
    });
    expect(response.body.id).toEqual(expect.any(String));

    const lead = await prisma.lead.findUniqueOrThrow({
      where: {
        id: response.body.id
      },
      include: {
        answers: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    expect(lead.companyId).toBe(company.id);
    expect(lead.flowId).toBe(flow.id);
    expect(lead.answers).toHaveLength(2);
    expect(lead.answers.map((answer) => answer.questionId)).toEqual(
      expect.arrayContaining([choiceQuestion.id, textQuestion.id])
    );
  });

  it("rejects invalid public submissions", async () => {
    const company = await createCompany("invalid-submission");
    const flow = await createFlowWithQuestions(
      company.id,
      `invalid-submission-${testRunId}`,
      FlowStatus.PUBLISHED
    );
    const flowWithQuestions = await prisma.flow.findUniqueOrThrow({
      where: {
        id: flow.id
      },
      include: {
        questions: {
          orderBy: {
            position: "asc"
          }
        }
      }
    });
    const requiredQuestion = flowWithQuestions.questions[0];

    await request(app.getHttpServer())
      .post(`/api/public-flows/${company.slug}/${flow.slug}/submissions`)
      .send({
        answers: []
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/public-flows/${company.slug}/${flow.slug}/submissions`)
      .send({
        answers: [
          {
            questionId: requiredQuestion.id,
            value: "aviao"
          }
        ]
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/public-flows/${company.slug}/${flow.slug}/submissions`)
      .send({
        answers: [
          {
            questionId: requiredQuestion.id,
            value: "carro"
          },
          {
            questionId: requiredQuestion.id,
            value: "moto"
          }
        ]
      })
      .expect(400);
  });

  it("rejects oversized public submission payloads", async () => {
    const company = await createCompany("oversized-submission");
    const flow = await createFlowWithQuestions(
      company.id,
      `oversized-submission-${testRunId}`,
      FlowStatus.PUBLISHED
    );

    await request(app.getHttpServer())
      .post(`/api/public-flows/${company.slug}/${flow.slug}/submissions`)
      .send({
        answers: Array.from({ length: 101 }, () => ({
          questionId: "00000000-0000-4000-8000-000000000000",
          value: "x"
        }))
      })
      .expect(400);
  });

  it("rate limits public submissions per flow and requester", async () => {
    const previousMax = process.env.PUBLIC_SUBMISSION_RATE_LIMIT_MAX;
    const previousWindow = process.env.PUBLIC_SUBMISSION_RATE_LIMIT_WINDOW_MS;
    process.env.PUBLIC_SUBMISSION_RATE_LIMIT_MAX = "1";
    process.env.PUBLIC_SUBMISSION_RATE_LIMIT_WINDOW_MS = "60000";

    const company = await createCompany("rate-limit");
    const flow = await createFlowWithQuestions(
      company.id,
      `rate-limit-${testRunId}`,
      FlowStatus.PUBLISHED
    );
    const flowWithQuestions = await prisma.flow.findUniqueOrThrow({
      where: {
        id: flow.id
      },
      include: {
        questions: {
          orderBy: {
            position: "asc"
          }
        }
      }
    });

    await request(app.getHttpServer())
      .post(`/api/public-flows/${company.slug}/${flow.slug}/submissions`)
      .send({
        answers: [
          {
            questionId: flowWithQuestions.questions[0].id,
            value: "carro"
          }
        ]
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/public-flows/${company.slug}/${flow.slug}/submissions`)
      .send({
        answers: [
          {
            questionId: flowWithQuestions.questions[0].id,
            value: "carro"
          }
        ]
      })
      .expect(429);

    if (previousMax === undefined) {
      delete process.env.PUBLIC_SUBMISSION_RATE_LIMIT_MAX;
    } else {
      process.env.PUBLIC_SUBMISSION_RATE_LIMIT_MAX = previousMax;
    }

    if (previousWindow === undefined) {
      delete process.env.PUBLIC_SUBMISSION_RATE_LIMIT_WINDOW_MS;
    } else {
      process.env.PUBLIC_SUBMISSION_RATE_LIMIT_WINDOW_MS = previousWindow;
    }
  });
});
