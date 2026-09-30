import "reflect-metadata";

import "class-transformer";
import { NestFactory } from "@nestjs/core";
import { Logger, RequestMethod, ValidationPipe } from "@nestjs/common";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import { json, urlencoded } from "express";
import type { Request, Response } from "express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { webOrigins } from "./common/config/env";

/** The deploy probe targets this path, so it must not follow the API version. */
const UNPREFIXED_ROUTES = [{ path: "health", method: RequestMethod.GET }];

/**
 * Landing page for `GET /`. Everything else on this server sits under
 * `/api/v1`, so without it the root answers 404 — indistinguishable from a
 * misrouted deploy when someone opens the domain to check it is alive.
 */
const WELCOME_PAGE = `<!doctype html>
<html lang="en">
  <meta charset="utf-8" />
  <title>Teamlyf API</title>
  <body>
    <h1>Welcome to Teamlyf</h1>
    <p>The API is running.</p>
    <ul>
      <li><a href="/docs">API reference</a></li>
      <li><a href="/health">Health</a></li>
    </ul>
  </body>
</html>
`;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.setGlobalPrefix("api/v1", { exclude: UNPREFIXED_ROUTES });

  // Same helper the WebSocket gateway uses, so the two layers cannot disagree.
  app.enableCors({ origin: webOrigins(), credentials: true });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          "style-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          "connect-src": ["'self'", "cdn.jsdelivr.net"],
        },
      },
    }),
  );
  app.use(compression());
  app.use(morgan("combined"));

  app.use(
    json({
      verify: (_req, _res, buffer) => {
        (_req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
      },
    }),
  );
  app.use(urlencoded({ extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("Teamlyf API")
    .setDescription("Teamlyf platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use("/docs-json", (_req: Request, res: Response) => res.json(document));

  // Anchored regex, and `use` not a bare "/": app.use("/") prefix-matches and
  // would swallow every path. app.get() is Nest's router .get() here, not Express's.
  app.use(/^\/$/, (_req: Request, res: Response) => {
    res.type("html").send(WELCOME_PAGE);
  });

  app.use(
    "/docs",
    apiReference({
      url: "/docs-json",
      theme: "kepler",
    }),
  );

  app.enableShutdownHooks();
  const port = process.env.PORT ?? 9001;
  await app.listen(port, "::");
  // The deploy platform maps a container port to the domain; printing it makes
  // a Traefik 502 ("started, yet unreachable") a one-line diagnosis.
  Logger.log(`Teamlyf API listening on port ${port}`, "Bootstrap");
}

void bootstrap();
