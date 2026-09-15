import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole, UserStatus } from "@prisma/client";
import * as argon2 from "argon2";
import { CompanyRepository } from "../companies/company.repository";
import { UserRepository } from "../users/user.repository";
import { AuthRepository } from "./auth.repository";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import type { AuthResponse } from "./types/auth-response";
import type { AuthenticatedUser } from "./types/authenticated-user";

const INVALID_CREDENTIALS_MESSAGE = "Email ou senha inválidos.";

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingCompany = await this.companyRepository.findBySlug(
      dto.companySlug
    );

    if (existingCompany) {
      throw new ConflictException("Slug da empresa já está em uso.");
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException("Email já está em uso.");
    }

    const passwordHash = await argon2.hash(dto.password);
    const { company, user } = await this.authRepository.createCompanyAndAdmin({
      company: {
        name: dto.companyName,
        slug: dto.companySlug,
        whatsappPhone: dto.whatsappPhone
      },
      user: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      }
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug
      },
      accessToken: await this.signAccessToken({
        userId: user.id,
        companyId: user.companyId,
        role: user.role
      })
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmailWithCompany(dto.email);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const validPassword = await argon2.verify(user.passwordHash, dto.password);

    if (!validPassword) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      company: user.company,
      accessToken: await this.signAccessToken({
        userId: user.id,
        companyId: user.companyId,
        role: user.role
      })
    };
  }

  async me(currentUser: AuthenticatedUser): Promise<Omit<AuthResponse, "accessToken">> {
    const user = await this.userRepository.findByIdAndCompanyIdWithCompany(
      currentUser.userId,
      currentUser.companyId
    );

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      company: user.company
    };
  }

  private signAccessToken(user: AuthenticatedUser): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.userId,
      companyId: user.companyId,
      role: user.role
    });
  }
}
