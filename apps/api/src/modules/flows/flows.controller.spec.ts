import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma.service";

type AuthSession = {
  accessToken: string;
  userId: string;
  companyId: string;
};

type FlowResponse = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  coverImageUrl: string | null;
  brandImageDisplay: "LOGO" | "PROFILE";
  primaryColor: string | null;
  backgroundColor: string | null;
  welcomeMessage: string | null;
  questions?: QuestionResponse[];
};

type QuestionResponse = {
  id: string;
  flowId: string;
  label: string;
  type: string;
  semanticType: string;
  required: boolean;
  position: number;
  options: Array<{
    id: string;
    label: string;
    value: string;
    position: number;
  }>;
};

describe("FlowsController", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const createdCompanyIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdFlowIds: string[] = [];

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
    await prisma.flow.deleteMany({
      where: {
        id: {
          in: createdFlowIds
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

  async function createSession(label: string): Promise<AuthSession> {
    const response = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        companyName: `LeadFlow Flow Test ${label}`,
        companySlug: `leadflow-flow-${label}-${testRunId}`,
        name: `Flow User ${label}`,
        email: `leadflow-flow-${label}-${testRunId}@example.com`,
        password: "secure-password"
      })
      .expect(201);

    createdUserIds.push(response.body.user.id);
    createdCompanyIds.push(response.body.company.id);

    return {
      accessToken: response.body.accessToken,
      userId: response.body.user.id,
      companyId: response.body.company.id
    };
  }

  async function createFlow(
    session: AuthSession,
    slug: string,
    name = "Aluguel de veículo"
  ): Promise<FlowResponse> {
    const response = await request(app.getHttpServer())
      .post("/api/flows")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        name,
        slug,
        description: "Qualificação de clientes interessados"
      })
      .expect(201);

    createdFlowIds.push(response.body.id);

    return response.body;
  }

  async function addQuestion(
    session: AuthSession,
    flowId: string,
    payload: Record<string, unknown>
  ): Promise<QuestionResponse> {
    const response = await request(app.getHttpServer())
      .post(`/api/flows/${flowId}/questions`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send(payload)
      .expect(201);

    return response.body;
  }

  it("requires JWT for private flow routes", async () => {
    await request(app.getHttpServer()).get("/api/flows").expect(401);
    await request(app.getHttpServer())
      .post("/api/flows")
      .send({ name: "Flow", slug: "flow" })
      .expect(401);
  });

  it("creates a flow using companyId from the JWT", async () => {
    const session = await createSession("create");
    const flow = await createFlow(session, `create-flow-${testRunId}`);

    expect(flow).toMatchObject({
      companyId: session.companyId,
      name: "Aluguel de veículo",
      slug: `create-flow-${testRunId}`,
      status: "DRAFT",
      coverImageUrl: null,
      brandImageDisplay: "LOGO",
      primaryColor: null,
      backgroundColor: null,
      welcomeMessage: null
    });
  });

  it("accepts local storage image paths that belong to the current flow", async () => {
    const session = await createSession("appearance-local");
    const flow = await createFlow(session, `appearance-local-${testRunId}`);
    const coverImageUrl = `/uploads/flows/${flow.id}/logo-11111111-1111-4111-8111-111111111111.jpg`;
    const backgroundImageUrl = `/uploads/flows/${flow.id}/background-22222222-2222-4222-8222-222222222222.webp`;

    const response = await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        coverImageUrl,
        backgroundImageUrl,
        brandImageDisplay: "PROFILE"
      })
      .expect(200);

    expect(response.body).toMatchObject({
      coverImageUrl,
      backgroundImageUrl,
      brandImageDisplay: "PROFILE"
    });
  });

  it("updates and returns flow appearance fields", async () => {
    const session = await createSession("appearance");
    const flow = await createFlow(session, `appearance-${testRunId}`);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        primaryColor: "#2563EB",
        backgroundColor: "#FFFFFF",
        coverImageUrl: "https://example.com/brand.webp",
        brandImageDisplay: "PROFILE",
        welcomeMessage: "Olá! Vamos encontrar a melhor opção para você.",
        externalLinkUrl: "https://example.com/catalogo",
        externalLinkLabel: "Ver catálogo"
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: flow.id,
      primaryColor: "#2563EB",
      backgroundColor: "#FFFFFF",
      coverImageUrl: "https://example.com/brand.webp",
      brandImageDisplay: "PROFILE",
      welcomeMessage: "Olá! Vamos encontrar a melhor opção para você.",
      externalLinkUrl: "https://example.com/catalogo",
      externalLinkLabel: "Ver catálogo"
    });

    const getResponse = await request(app.getHttpServer())
      .get(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(200);

    expect(getResponse.body).toMatchObject({
      primaryColor: "#2563EB",
      backgroundColor: "#FFFFFF",
      coverImageUrl: "https://example.com/brand.webp",
      brandImageDisplay: "PROFILE",
      welcomeMessage: "Olá! Vamos encontrar a melhor opção para você.",
      externalLinkUrl: "https://example.com/catalogo",
      externalLinkLabel: "Ver catálogo"
    });

    const logoResponse = await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ brandImageDisplay: "LOGO" })
      .expect(200);

    expect(logoResponse.body).toMatchObject({
      coverImageUrl: "https://example.com/brand.webp",
      brandImageDisplay: "LOGO"
    });
  });

  it("rejects invalid appearance values", async () => {
    const session = await createSession("appearance-invalid");
    const flow = await createFlow(session, `appearance-invalid-${testRunId}`);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ primaryColor: "red" })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ backgroundColor: "rgb(255, 255, 255)" })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ coverImageUrl: "javascript:alert(1)" })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ welcomeMessage: "x".repeat(281) })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ externalLinkUrl: "javascript:alert(1)" })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ brandImageDisplay: "AVATAR" })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ coverImageUrl: "../../etc/passwd" })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ backgroundImageUrl: "/uploads/../secret.png" })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        coverImageUrl:
          "/uploads/flows/00000000-0000-4000-8000-000000000000/logo-11111111-1111-4111-8111-111111111111.jpg"
      })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        backgroundImageUrl: `/uploads/flows/${flow.id}/logo-11111111-1111-4111-8111-111111111111.jpg`
      })
      .expect(400);
  });

  it("uploads, replaces and removes flow logo for the owning company", async () => {
    const session = await createSession("upload-logo");
    const flow = await createFlow(session, `upload-logo-${testRunId}`);
    const image = Buffer.from("fake-png");

    const uploadResponse = await request(app.getHttpServer())
      .post(`/api/flows/${flow.id}/logo`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .attach("file", image, {
        filename: "logo.png",
        contentType: "image/png"
      })
      .expect(201);

    expect(uploadResponse.body.coverImageUrl).toMatch(
      new RegExp(`^/uploads/flows/${flow.id}/logo-.*\\.png$`)
    );

    const removeResponse = await request(app.getHttpServer())
      .delete(`/api/flows/${flow.id}/logo`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(200);

    expect(removeResponse.body.coverImageUrl).toBeNull();
  });

  it("uploads background only for a flow owned by the authenticated company", async () => {
    const companyA = await createSession("upload-bg-a");
    const companyB = await createSession("upload-bg-b");
    const flowB = await createFlow(companyB, `upload-bg-b-${testRunId}`);

    await request(app.getHttpServer())
      .post(`/api/flows/${flowB.id}/background`)
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .attach("file", Buffer.from("fake-webp"), {
        filename: "background.webp",
        contentType: "image/webp"
      })
      .expect(404);

    const response = await request(app.getHttpServer())
      .post(`/api/flows/${flowB.id}/background`)
      .set("Authorization", `Bearer ${companyB.accessToken}`)
      .attach("file", Buffer.from("fake-webp"), {
        filename: "background.webp",
        contentType: "image/webp"
      })
      .expect(201);

    expect(response.body.backgroundImageUrl).toMatch(
      new RegExp(`^/uploads/flows/${flowB.id}/background-.*\\.webp$`)
    );
  });

  it("rejects invalid upload MIME and files above 2 MB", async () => {
    const session = await createSession("upload-invalid");
    const flow = await createFlow(session, `upload-invalid-${testRunId}`);

    await request(app.getHttpServer())
      .post(`/api/flows/${flow.id}/logo`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .attach("file", Buffer.from("<svg></svg>"), {
        filename: "logo.svg",
        contentType: "image/svg+xml"
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/flows/${flow.id}/logo`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .attach("file", Buffer.alloc(2 * 1024 * 1024 + 1), {
        filename: "large.png",
        contentType: "image/png"
      })
      .expect(413);
  });

  it("lists only flows from the authenticated company", async () => {
    const companyA = await createSession("list-a");
    const companyB = await createSession("list-b");
    const flowA = await createFlow(companyA, `list-a-${testRunId}`);
    await createFlow(companyB, `list-b-${testRunId}`);

    const response = await request(app.getHttpServer())
      .get("/api/flows")
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .expect(200);

    const flowIds = response.body.map((flow: FlowResponse) => flow.id);

    expect(flowIds).toContain(flowA.id);
    expect(response.body).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ companyId: companyB.companyId })
      ])
    );
  });

  it("does not allow reading or editing a flow from another company", async () => {
    const companyA = await createSession("isolation-a");
    const companyB = await createSession("isolation-b");
    const flowB = await createFlow(companyB, `isolation-b-${testRunId}`);

    await request(app.getHttpServer())
      .get(`/api/flows/${flowB.id}`)
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flowB.id}`)
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .send({ brandImageDisplay: "PROFILE" })
      .expect(404);
  });

  it("enforces flow slug uniqueness per company only", async () => {
    const companyA = await createSession("slug-a");
    const companyB = await createSession("slug-b");
    const slug = `same-slug-${testRunId}`;

    await createFlow(companyA, slug);
    await createFlow(companyB, slug);

    await request(app.getHttpServer())
      .post("/api/flows")
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .send({ name: "Duplicado", slug })
      .expect(409);
  });

  it("creates questions and returns questions/options ordered by position", async () => {
    const session = await createSession("questions");
    const flow = await createFlow(session, `questions-${testRunId}`);

    await addQuestion(session, flow.id, {
      label: "Segunda pergunta",
      type: "TEXT",
      required: false,
      position: 2
    });
    const choiceQuestion = await addQuestion(session, flow.id, {
      label: "Qual tipo de veículo você procura?",
      type: "SINGLE_CHOICE",
      required: true,
      position: 1,
      options: [
        { label: "Moto", value: "moto", position: 2 },
        { label: "Carro", value: "carro", position: 1 }
      ]
    });

    expect(choiceQuestion.options.map((option) => option.position)).toEqual([
      1,
      2
    ]);

    const response = await request(app.getHttpServer())
      .get(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(200);

    expect(
      response.body.questions.map((question: QuestionResponse) => question.position)
    ).toEqual([1, 2]);
    expect(response.body.questions[0].options.map((option: { position: number }) => option.position)).toEqual([
      1,
      2
    ]);
  });

  it("does not allow adding, editing or deleting questions in another company flow", async () => {
    const companyA = await createSession("question-iso-a");
    const companyB = await createSession("question-iso-b");
    const flowB = await createFlow(companyB, `question-iso-b-${testRunId}`);
    const questionB = await addQuestion(companyB, flowB.id, {
      label: "Pergunta B",
      type: "TEXT",
      position: 1
    });

    await request(app.getHttpServer())
      .post(`/api/flows/${flowB.id}/questions`)
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .send({ label: "Ataque", type: "TEXT", position: 1 })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flowB.id}/questions/${questionB.id}`)
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .send({ label: "Ataque" })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/flows/${flowB.id}/questions/${questionB.id}`)
      .set("Authorization", `Bearer ${companyA.accessToken}`)
      .expect(404);
  });

  it("reorders questions atomically and rejects questions from another flow", async () => {
    const session = await createSession("reorder");
    const firstFlow = await createFlow(session, `reorder-one-${testRunId}`);
    const secondFlow = await createFlow(session, `reorder-two-${testRunId}`);

    const firstQuestion = await addQuestion(session, firstFlow.id, {
      label: "Primeira",
      type: "TEXT",
      position: 1
    });
    const secondQuestion = await addQuestion(session, firstFlow.id, {
      label: "Segunda",
      type: "TEXT",
      position: 2
    });
    const otherQuestion = await addQuestion(session, secondFlow.id, {
      label: "Outro flow",
      type: "TEXT",
      position: 1
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/flows/${firstFlow.id}/questions/reorder`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ questionIds: [secondQuestion.id, firstQuestion.id] })
      .expect(200);

    expect(response.body.map((question: QuestionResponse) => question.id)).toEqual([
      secondQuestion.id,
      firstQuestion.id
    ]);
    expect(
      response.body.map((question: QuestionResponse) => question.position)
    ).toEqual([1, 2]);

    await request(app.getHttpServer())
      .patch(`/api/flows/${firstFlow.id}/questions/reorder`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ questionIds: [firstQuestion.id, otherQuestion.id] })
      .expect(400);
  });

  it("supports semantic contact types with compatibility rules and NONE default", async () => {
    const session = await createSession("semantic");
    const flow = await createFlow(session, `semantic-${testRunId}`);

    const normalQuestion = await addQuestion(session, flow.id, {
      label: "Observação",
      type: "TEXT",
      position: 1
    });

    expect(normalQuestion.semanticType).toBe("NONE");

    await addQuestion(session, flow.id, {
      label: "Como podemos te chamar?",
      type: "TEXT",
      semanticType: "CONTACT_NAME",
      position: 2
    });

    await addQuestion(session, flow.id, {
      label: "Qual seu WhatsApp?",
      type: "PHONE",
      semanticType: "CONTACT_PHONE",
      position: 3
    });

    await addQuestion(session, flow.id, {
      label: "Qual seu email?",
      type: "EMAIL",
      semanticType: "CONTACT_EMAIL",
      position: 4
    });

    await request(app.getHttpServer())
      .post(`/api/flows/${flow.id}/questions`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        label: "Telefone incompatível",
        type: "TEXT",
        semanticType: "CONTACT_PHONE",
        position: 5
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/flows/${flow.id}/questions`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        label: "Email duplicado",
        type: "EMAIL",
        semanticType: "CONTACT_EMAIL",
        position: 6
      })
      .expect(409);

    const response = await request(app.getHttpServer())
      .get(`/api/flows/${flow.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(200);

    expect(
      response.body.questions.map((question: QuestionResponse) => question.semanticType)
    ).toEqual(["NONE", "CONTACT_NAME", "CONTACT_PHONE", "CONTACT_EMAIL"]);
  });

  it("allows editing a question keeping its own semanticType and rejects conflicts", async () => {
    const session = await createSession("semantic-edit");
    const flow = await createFlow(session, `semantic-edit-${testRunId}`);
    const phoneQuestion = await addQuestion(session, flow.id, {
      label: "WhatsApp",
      type: "PHONE",
      semanticType: "CONTACT_PHONE",
      position: 1
    });
    const emailQuestion = await addQuestion(session, flow.id, {
      label: "Email",
      type: "EMAIL",
      semanticType: "CONTACT_EMAIL",
      position: 2
    });

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}/questions/${phoneQuestion.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        label: "WhatsApp principal",
        semanticType: "CONTACT_PHONE"
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}/questions/${emailQuestion.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        type: "PHONE",
        semanticType: "CONTACT_PHONE"
      })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}/questions/${emailQuestion.id}`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({
        type: "TEXT",
        semanticType: "CONTACT_EMAIL"
      })
      .expect(400);
  });

  it("requires at least one question to publish and can unpublish", async () => {
    const session = await createSession("publish");
    const flow = await createFlow(session, `publish-${testRunId}`);

    await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}/publish`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(400);

    await addQuestion(session, flow.id, {
      label: "Nome",
      type: "TEXT",
      required: true,
      position: 1
    });

    const publishResponse = await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}/publish`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(200);

    expect(publishResponse.body.status).toBe("PUBLISHED");

    const unpublishResponse = await request(app.getHttpServer())
      .patch(`/api/flows/${flow.id}/unpublish`)
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(200);

    expect(unpublishResponse.body.status).toBe("DRAFT");
  });
});
