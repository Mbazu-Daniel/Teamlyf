import { BadRequestException, Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ChatUuidMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    for (const name of ["orgId", "channelId", "messageId"]) {
      const value = req.params[name];
      if (Array.isArray(value)) {
        throw new BadRequestException(`Invalid ${name}`);
      }
      if (value !== undefined && !UUID_V7_PATTERN.test(value)) {
        throw new BadRequestException(`Invalid ${name}`);
      }
    }

    next();
  }
}
