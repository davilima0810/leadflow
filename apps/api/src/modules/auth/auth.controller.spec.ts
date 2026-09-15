import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserStatus } from "@prisma/client";
import * as argon2 from "argon2";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma.service";

type RegisterResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
  accessToken: string;
};

describe("AuthController", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const createdUserIds: string[] = [];
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

  function registerPayload(overrides: Record<string, unknown> = {}) {
    return {
      companyName: "LeadFlow Auth Test Company",
      companySlug: `leadflow-auth-test-${testRunId}`,
      name: "LeadFlow Auth User",
      email: `leadflow-auth-test-${testRunId}@example.com`,
      password: "secure-password",
      whatsappPhone: "5586999999999",
      ...overrides
    };
  }

  async function register(overrides: Record<string, unknown> = {}) {
    const response = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(registerPayload(overrides))
      .expect(201);

    const body = response.body as RegisterResponse;

    createdUserIds.push(body.user.id);
    createdCompanyIds.push(body.company.id);

    return body;
  }

  it("register creates a company and ADMIN ACTIVE user", async () => {
    const body = await register();

    expect(body.accessToken).toEqual(expect.any(String));
    expect(JSON.stringify(body)).not.toContain("passwordHash");
    expect(body.user).toMatchObject({
      name: "LeadFlow Auth User",
      email: `leadflow-auth-test-${testRunId}@example.com`,
      role: "ADMIN"
    });
    expect(body.company).toMatchObject({
      name: "LeadFlow Auth Test Company",
      slug: `leadflow-auth-test-${testRunId}`
    });

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: body.user.id
      },
      include: {
        company: true
      }
    });

    expect(persistedUser.status).toBe("ACTIVE");
    expect(persistedUser.role).toBe("ADMIN");
    expect(persistedUser.companyId).toBe(body.company.id);
    expect(persistedUser.company.slug).toBe(body.company.slug);
    expect(persistedUser.passwordHash).not.toBe("secure-password");
    await expect(
      argon2.verify(persistedUser.passwordHash, "secure-password")
    ).resolves.toBe(true);
  });

  it("register rejects duplicated company slug", async () => {
    const first = await register({
      companySlug: `leadflow-auth-dup-slug-${testRunId}`,
      email: `leadflow-auth-dup-slug-1-${testRunId}@example.com`
    });

    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(
        registerPayload({
          companySlug: first.company.slug,
          email: `leadflow-auth-dup-slug-2-${testRunId}@example.com`
        })
      )
      .expect(409);
  });

  it("register rejects duplicated user email", async () => {
    const first = await register({
      companySlug: `leadflow-auth-dup-email-1-${testRunId}`,
      email: `leadflow-auth-dup-email-${testRunId}@example.com`
    });

    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(
        registerPayload({
          companySlug: `leadflow-auth-dup-email-2-${testRunId}`,
          email: first.user.email
        })
      )
      .expect(409);
  });

  it("does not leave an orphan company when user creation fails in transaction", async () => {
    const existing = await register({
      companySlug: `leadflow-auth-transaction-existing-${testRunId}`,
      email: `leadflow-auth-transaction-existing-${testRunId}@example.com`
    });
    const failingCompanySlug = `leadflow-auth-transaction-fail-${testRunId}`;

    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(
        registerPayload({
          companySlug: failingCompanySlug,
          email: existing.user.email
        })
      )
      .expect(409);

    await expect(
      prisma.company.findUnique({
        where: {
          slug: failingCompanySlug
        }
      })
    ).resolves.toBeNull();
  });

  it("login returns JWT for valid credentials", async () => {
    const registered = await register({
      companySlug: `leadflow-auth-login-${testRunId}`,
      email: `leadflow-auth-login-${testRunId}@example.com`
    });

    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: registered.user.email,
        password: "secure-password"
      })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.id).toBe(registered.user.id);
    expect(response.body.company.id).toBe(registered.company.id);
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });

  it("login rejects wrong password and unknown email equivalently", async () => {
    const registered = await register({
      companySlug: `leadflow-auth-invalid-login-${testRunId}`,
      email: `leadflow-auth-invalid-login-${testRunId}@example.com`
    });

    const wrongPassword = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: registered.user.email,
        password: "wrong-password"
      })
      .expect(401);

    const unknownEmail = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: `leadflow-auth-missing-${testRunId}@example.com`,
        password: "wrong-password"
      })
      .expect(401);

    expect(wrongPassword.body.message).toBe("Email ou senha inválidos.");
    expect(unknownEmail.body.message).toBe("Email ou senha inválidos.");
  });

  it("login rejects inactive user", async () => {
    const company = await prisma.company.create({
      data: {
        name: "LeadFlow Inactive Auth Company",
        slug: `leadflow-auth-inactive-${testRunId}`
      }
    });
    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        name: "Inactive User",
        email: `leadflow-auth-inactive-${testRunId}@example.com`,
        passwordHash: await argon2.hash("secure-password"),
        status: UserStatus.INACTIVE
      }
    });

    createdCompanyIds.push(company.id);
    createdUserIds.push(user.id);

    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: user.email,
        password: "secure-password"
      })
      .expect(401);

    expect(response.body.message).toBe("Email ou senha inválidos.");
  });

  it("/auth/me requires JWT and returns the current user context", async () => {
    await request(app.getHttpServer()).get("/api/auth/me").expect(401);

    const registered = await register({
      companySlug: `leadflow-auth-me-${testRunId}`,
      email: `leadflow-auth-me-${testRunId}@example.com`
    });

    const response = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registered.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      user: {
        id: registered.user.id,
        email: registered.user.email,
        role: "ADMIN"
      },
      company: {
        id: registered.company.id,
        slug: registered.company.slug
      }
    });
    expect(response.body.accessToken).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });
});
