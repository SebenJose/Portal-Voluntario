import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
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

export function submissionRecord(item: Submission) {
  return {
    id: item.id, title: item.title, category: item.category, hours: item.hours,
    description: item.description, status: item.status, createdAt: item.createdAt.toISOString(),
    document: { name: item.documentName, type: item.documentType, size: item.documentSize },
    review: item.reviewedAt ? { note: item.reviewNote, reviewedAt: item.reviewedAt.toISOString() } : null,
  };
}

function assertEditable(item: Submission): void {
  if (item.status !== "Em análise") throw new ConflictException("O certificado já foi avaliado e não pode ser alterado.");
}

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(SubmissionEntity) private readonly submissions: Repository<Submission>,
    private readonly transactions: TransactionsService,
  ) {}

  async list(userId: string) {
    const items = await this.submissions.find({ where: { userId }, order: { createdAt: "DESC", id: "ASC" } });
    return { items: items.map(submissionRecord) };
  }

  async get(userId: string, id: string) {
    const item = await this.submissions.findOneBy({ id, userId });
    if (!item) throw new NotFoundException("Certificado não encontrado.");
    return submissionRecord(item);
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
      const repository = manager.withRepository(this.submissions);
      return repository.save(repository.create({ ...fields, userId, documentName, documentType: file.mimetype, documentSize: file.size, document: file.buffer }));
    });
    return submissionRecord(item);
  }

  async update(userId: string, id: string, input: UpdateSubmissionDto) {
    await this.transactions.run(async (manager) => {
      const repository = manager.withRepository(this.submissions);
      const item = await repository.findOneBy({ id, userId });
      if (!item) throw new NotFoundException("Certificado não encontrado.");
      assertEditable(item);
      if (Object.keys(input).length > 0) await repository.update({ id, userId }, input);
    });
    return this.get(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.transactions.run(async (manager) => {
      const repository = manager.withRepository(this.submissions);
      const item = await repository.findOneBy({ id, userId });
      if (!item) throw new NotFoundException("Certificado não encontrado.");
      assertEditable(item);
      await repository.delete({ id, userId });
    });
  }

  async document(userId: string, id: string): Promise<Submission> {
    const item = await this.submissions.createQueryBuilder("submission").addSelect("submission.document")
      .where("submission.id = :id AND submission.userId = :userId", { id, userId }).getOne();
    if (!item) throw new NotFoundException("Certificado não encontrado.");
    return item;
  }
}
