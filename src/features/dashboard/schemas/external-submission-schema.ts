import { z } from "zod";

const allowedDocumentTypes = ["application/pdf", "image/jpeg", "image/png"];
const maxDocumentSize = 5 * 1024 * 1024;

export const externalSubmissionSchema = z.object({
  title: z.string().trim().min(5, "Informe um título com pelo menos 5 caracteres."),
  category: z.enum(["Ensino", "Pesquisa", "Extensão"]),
  hours: z
    .number()
    .int("Informe um número inteiro de horas.")
    .min(1, "Informe pelo menos 1 hora.")
    .max(200, "O limite é de 200 horas por envio."),
  description: z.string().trim().min(10, "Descreva a atividade com pelo menos 10 caracteres."),
  document: z
    .custom<FileList>(
      (value) => typeof FileList !== "undefined" && value instanceof FileList && value.length === 1,
      "Anexe o certificado para continuar.",
    )
    .refine((files) => {
      if (typeof FileList === "undefined" || !(files instanceof FileList) || files.length !== 1) {
        return false;
      }
      const file = files.item(0);
      return file !== null && allowedDocumentTypes.includes(file.type);
    }, "Envie um arquivo PDF, JPG ou PNG.")
    .refine((files) => {
      if (typeof FileList === "undefined" || !(files instanceof FileList) || files.length !== 1) {
        return false;
      }
      const file = files.item(0);
      return file !== null && file.size <= maxDocumentSize;
    }, "O arquivo deve ter no máximo 5 MB."),
});

export type ExternalSubmissionFormValues = z.infer<typeof externalSubmissionSchema>;
