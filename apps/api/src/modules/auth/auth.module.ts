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
    // These stay on the raw better-auth handler because it owns the response:
    // the callback must answer with a 302 and its own Set-Cookie headers, and
    // /error and /ok are the pages it redirects the browser to afterwards.
    // Every other auth route is a normal controller method (DTO validation,
    // Swagger, JSON errors).
    //
    // Paths are written without /api/v1 because Nest matches middleware against
    // the global-prefixed request path: "auth/callback/*" resolves to
    // /api/v1/auth/callback/*.
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: "auth/callback/*", method: RequestMethod.GET },
        { path: "auth/error", method: RequestMethod.GET },
        { path: "auth/ok", method: RequestMethod.GET },
      );
  }
}
