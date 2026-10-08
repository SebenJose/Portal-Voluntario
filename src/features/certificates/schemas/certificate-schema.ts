import { z } from "zod";

import { activityCategories } from "@/lib/activity-categories";

export const certificateDocumentTypes = ["application/pdf", "image/jpeg", "image/png"] as const;
export const maximumCertificateSize = 5 * 1024 * 1024;

export const certificateFieldsSchema = z.object({
  title: z.string().trim().min(5, "Informe um título com pelo menos 5 caracteres."),
  category: z.enum(activityCategories),
  hours: z.number()
    .int("Informe um número inteiro de horas.")
    .min(1, "Informe pelo menos 1 hora.")
    .max(200, "O limite é de 200 horas por envio."),
  description: z.string().trim().min(10, "Descreva a atividade com pelo menos 10 caracteres."),
});

export const certificateBlobSchema = z.custom<Blob>(
  (value) => typeof Blob !== "undefined" && value instanceof Blob,
  "O comprovante é inválido.",
).refine(
  (file) => certificateDocumentTypes.some((type) => type === file.type),
  "Envie um arquivo PDF, JPG ou PNG.",
).refine(
  (file) => file.size > 0 && file.size <= maximumCertificateSize,
  "O arquivo deve conter dados e ter no máximo 5 MB.",
);

export const certificateRecordSchema = certificateFieldsSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  status: z.literal("Em análise"),
  document: z.object({
    name: z.string().min(1),
    type: z.enum(certificateDocumentTypes),
    size: z.number().int().positive().max(maximumCertificateSize),
  }),
});

export const certificateListSchema = z.object({ items: z.array(certificateRecordSchema) });

export type CertificateFields = z.infer<typeof certificateFieldsSchema>;
export type CertificateRecord = z.infer<typeof certificateRecordSchema>;
