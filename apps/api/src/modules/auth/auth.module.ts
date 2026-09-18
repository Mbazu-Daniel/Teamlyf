import { Global, Module, MiddlewareConsumer, NestModule, RequestMethod } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthMiddleware } from "./auth.middleware";

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: "auth/callback/*", method: RequestMethod.GET },
      { path: "auth/sign-in/social", method: RequestMethod.POST },
    );
  }
}
