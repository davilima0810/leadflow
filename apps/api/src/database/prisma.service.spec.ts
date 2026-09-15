import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { CompanyRepository } from "../modules/companies/company.repository";
import { UserRepository } from "../modules/users/user.repository";

describe("Prisma repositories", () => {
  const prisma = new PrismaService();
  const companyRepository = new CompanyRepository(prisma);
  const userRepository = new UserRepository(prisma);
  const testRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const createdUserIds: string[] = [];
  const createdCompanyIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
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

    await prisma.$disconnect();
  });

  it("connects to the database", async () => {
    const result = await prisma.$queryRaw<Array<{ connected: number }>>`
      SELECT 1 as connected
    `;

    expect(result).toEqual([{ connected: 1 }]);
  });

  it("creates and reads a company", async () => {
    const company = await companyRepository.create({
      name: "LeadFlow Test Company",
      slug: `leadflow-test-company-${testRunId}`
    });

    createdCompanyIds.push(company.id);

    await expect(companyRepository.findById(company.id)).resolves.toMatchObject({
      id: company.id,
      name: "LeadFlow Test Company"
    });

    await expect(companyRepository.findBySlug(company.slug)).resolves.toMatchObject({
      id: company.id,
      slug: company.slug
    });
  });

  it("creates and reads a user related to a company", async () => {
    const company = await companyRepository.create({
      name: "LeadFlow Test User Company",
      slug: `leadflow-test-user-company-${testRunId}`
    });

    createdCompanyIds.push(company.id);

    const user = await userRepository.create({
      company: {
        connect: {
          id: company.id
        }
      },
      name: "LeadFlow Test User",
      email: `leadflow-test-user-${testRunId}@example.com`,
      passwordHash: "not-a-plain-password-hash"
    });

    createdUserIds.push(user.id);

    await expect(userRepository.findById(user.id)).resolves.toMatchObject({
      id: user.id,
      companyId: company.id
    });

    await expect(userRepository.findByEmail(user.email)).resolves.toMatchObject({
      id: user.id,
      email: user.email
    });

    await expect(
      userRepository.findByIdAndCompanyId(user.id, company.id)
    ).resolves.toMatchObject({
      id: user.id,
      companyId: company.id
    });

    const userWithCompany = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      include: {
        company: true
      }
    });

    expect(userWithCompany?.company).toMatchObject({
      id: company.id,
      slug: company.slug
    });
  });

  it("enforces unique company slug", async () => {
    const slug = `leadflow-test-unique-company-${testRunId}`;
    const company = await companyRepository.create({
      name: "LeadFlow Unique Company",
      slug
    });

    createdCompanyIds.push(company.id);

    await expect(
      companyRepository.create({
        name: "LeadFlow Duplicate Company",
        slug
      })
    ).rejects.toMatchObject({
      code: "P2002"
    } satisfies Partial<Prisma.PrismaClientKnownRequestError>);
  });

  it("enforces globally unique user email", async () => {
    const email = `leadflow-test-unique-user-${testRunId}@example.com`;
    const firstCompany = await companyRepository.create({
      name: "LeadFlow Unique User Company 1",
      slug: `leadflow-test-unique-user-company-1-${testRunId}`
    });
    const secondCompany = await companyRepository.create({
      name: "LeadFlow Unique User Company 2",
      slug: `leadflow-test-unique-user-company-2-${testRunId}`
    });

    createdCompanyIds.push(firstCompany.id, secondCompany.id);

    const user = await userRepository.create({
      company: {
        connect: {
          id: firstCompany.id
        }
      },
      name: "LeadFlow Unique User",
      email,
      passwordHash: "not-a-plain-password-hash"
    });

    createdUserIds.push(user.id);

    await expect(
      userRepository.create({
        company: {
          connect: {
            id: secondCompany.id
          }
        },
        name: "LeadFlow Duplicate User",
        email,
        passwordHash: "not-a-plain-password-hash"
      })
    ).rejects.toMatchObject({
      code: "P2002"
    } satisfies Partial<Prisma.PrismaClientKnownRequestError>);
  });
});
