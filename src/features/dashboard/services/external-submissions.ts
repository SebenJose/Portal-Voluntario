import { z } from "zod";

import type { ExternalSubmissionFormValues } from "../schemas/external-submission-schema";

const externalSubmissionResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.literal("Em análise"),
});

export type ExternalSubmissionReceipt = z.infer<typeof externalSubmissionResponseSchema>;

export class ExternalSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExternalSubmissionError";
  }
}

export async function submitExternalCertificate(
  values: ExternalSubmissionFormValues,
): Promise<ExternalSubmissionReceipt> {
  const file = values.document.item(0);

  if (!file) {
    throw new ExternalSubmissionError("Selecione o certificado novamente e tente enviar.");
  }

  const body = new FormData();
  body.set("title", values.title);
  body.set("category", values.category);
  body.set("hours", String(values.hours));
  body.set("description", values.description);
  body.set("document", file);

  let response: Response;

  try {
    response = await fetch("/api/submissions", { method: "POST", body });
  } catch {
    throw new ExternalSubmissionError("Não foi possível conectar ao serviço. Tente novamente.");
  }

  if (!response.ok) {
    throw new ExternalSubmissionError("Não foi possível enviar o certificado. Tente novamente.");
  }

  const result: unknown = await response.json().catch(() => null);
  const parsedResult = externalSubmissionResponseSchema.safeParse(result);

  if (!parsedResult.success) {
    throw new ExternalSubmissionError("O serviço retornou uma resposta inválida. Tente novamente.");
  }

  return parsedResult.data;
}
