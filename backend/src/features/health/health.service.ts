import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { z } from "zod";

const probeSchema = z.array(z.object({ connected: z.literal(1) })).length(1);

@Injectable()
export class HealthService {
  constructor(@InjectDataSource() private readonly database: DataSource) {}

  async check(): Promise<{ status: "ok"; database: "up" }> {
    try {
      const result: unknown = await this.database.query("SELECT 1 AS connected");
      probeSchema.parse(result);
      return { status: "ok", database: "up" };
    } catch {
      throw new ServiceUnavailableException();
    }
  }
}
