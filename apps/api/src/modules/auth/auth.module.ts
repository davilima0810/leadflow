import { Module } from "@nestjs/common";
import { JwtModule, type JwtSignOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { CompanyRepository } from "../companies/company.repository";
import { UserRepository } from "../users/user.repository";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ??
  "1h") as JwtSignOptions["expiresIn"];

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: jwtExpiresIn
      }
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    CompanyRepository,
    UserRepository,
    JwtStrategy
  ]
})
export class AuthModule {}
