import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { z } from "zod";
import { TransactionsService } from "@/database/transactions.service";
import { SubmissionEntity, type Submission } from "@/features/certificates/submission.entity";
import type { SubmissionFieldsDto, UpdateSubmissionDto } from "@/features/certificates/submission.dto";

const fileSchema = z.object({
  originalname: z.string().min(1).max(255),
  mimetype: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  size: z.number().int().min(1).max(5 * 1024 * 1024),
  buffer: z.instanceof(Buffer),
}).refine((file) => file.buffer.length === file.size);

function record(item: Submission) {
  return {
    id: item.id, title: item.title, category: item.category, hours: item.hours,
    description: item.description, status: item.status, createdAt: item.createdAt.toISOString(),
    document: { name: item.documentName, type: item.documentType, size: item.documentSize },
  };
}

@Injectable()
export class SubmissionsService {
  constructor(@InjectDataSource() private readonly database: DataSource, private readonly transactions: TransactionsService) {}

  async list(userId: string) {
    const items = await this.database.getRepository(SubmissionEntity).find({ where: { userId }, order: { createdAt: "DESC", id: "ASC" } });
    return { items: items.map(record) };
  }

  async get(userId: string, id: string) {
    const item = await this.database.getRepository(SubmissionEntity).findOneBy({ id, userId });
    if (!item) throw new NotFoundException("Certificado não encontrado.");
    return record(item);
  }

  async create(userId: string, fields: SubmissionFieldsDto, input: unknown) {
    const parsed = fileSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException("Envie um PDF, JPG ou PNG válido com até 5 MB.");
    const file = parsed.data;
    const signature = file.mimetype === "application/pdf" ? file.buffer.subarray(0, 5).toString() === "%PDF-"
      : file.mimetype === "image/png" ? file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : file.buffer[0] === 255 && file.buffer[1] === 216 && file.buffer[2] === 255;
    if (!signature) throw new BadRequestException("O conteúdo do comprovante não corresponde ao formato informado.");
    const documentName = file.originalname.replaceAll("\\", "/").split("/").pop()?.replace(/[\u0000-\u001f\u007f]/gu, "") || "comprovante";
    const item = await this.transactions.run(async (manager) => {
      const repository = manager.getRepository(SubmissionEntity);
      return repository.save(repository.create({ ...fields, userId, documentName, documentType: file.mimetype, documentSize: file.size, document: file.buffer }));
    });
    return record(item);
  }

  async update(userId: string, id: string, input: UpdateSubmissionDto) {
    await this.transactions.run(async (manager) => {
      const repository = manager.getRepository(SubmissionEntity);
      const item = await repository.findOneBy({ id, userId });
      if (!item) throw new NotFoundException("Certificado não encontrado.");
      if (Object.keys(input).length > 0) await repository.update({ id, userId }, input);
    });
    return this.get(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.transactions.run(async (manager) => {
      const result = await manager.getRepository(SubmissionEntity).delete({ id, userId });
      if (!result.affected) throw new NotFoundException("Certificado não encontrado.");
    });
  }

  async document(userId: string, id: string): Promise<Submission> {
    const item = await this.database.getRepository(SubmissionEntity).createQueryBuilder("submission").addSelect("submission.document")
      .where("submission.id = :id AND submission.userId = :userId", { id, userId }).getOne();
    if (!item) throw new NotFoundException("Certificado não encontrado.");
    return item;
  }
}
