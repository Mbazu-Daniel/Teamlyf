import { Controller, Get, HttpCode, HttpStatus, Inject, Param, Put, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { STORAGE_SERVICE, type StorageService } from "./storage.types";

/**
 * The byte relay behind every capability URL. It deliberately sits outside the
 * authenticated API surface: the token in the path carries its own signature,
 * expiry, and scope, which is what makes the URL presigned-like.
 */
@ApiTags("Storage")
@Controller("storage")
export class StorageController {
  constructor(@Inject(STORAGE_SERVICE) private readonly storage: StorageService) {}

  @Put("upload/:token")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Upload the bytes a signed upload URL was minted for" })
  @ApiParam({ name: "token" })
  async upload(@Param("token") token: string, @Req() request: Request): Promise<void> {
    await this.storage.acceptUpload(token, {
      chunks: request,
      contentType: request.headers["content-type"],
    });
  }

  @Get("download/:token")
  @ApiOperation({ summary: "Download the bytes a signed download URL was minted for" })
  @ApiParam({ name: "token" })
  async download(@Param("token") token: string, @Res() response: Response): Promise<void> {
    const object = await this.storage.readDownload(token);

    // The client supplied the content type at upload time, so it is echoed as
    // an opaque attachment rather than replayed as a renderable type.
    response.setHeader("Content-Type", "application/octet-stream");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(object.fileName).replace(/'/g, "%27")}`,
    );
    response.send(object.body);
  }
}
