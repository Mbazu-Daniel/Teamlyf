import { Global, Module, MiddlewareConsumer, NestModule, RequestMethod } from "@nestjs/common";
import { SessionGuard } from "../../common/better-auth/session.guard";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthMiddleware } from "./auth.middleware";

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionGuard],
  exports: [AuthService, SessionGuard],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: "auth/callback/*", method: RequestMethod.GET },
      { path: "auth/sign-in/social", method: RequestMethod.POST },
      { path: "auth/update-user", method: RequestMethod.POST },
    );
  }
}
