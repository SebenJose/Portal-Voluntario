import { z } from "zod";

import {
  certificateBlobSchema,
  certificateFieldsSchema,
  certificateListSchema,
  certificateRecordSchema,
  type CertificateFields,
  type CertificateRecord,
} from "@/features/certificates/schemas/certificate-schema";

const errorSchema = z.object({ message: z.string().min(1) });

export class CertificatesServiceError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "CertificatesServiceError";
  }
}

async function requestCertificates(path: string, options?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, options);
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new CertificatesServiceError("Não foi possível conectar ao serviço de certificados. Tente novamente.");
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const parsed = errorSchema.safeParse(body);
    throw new CertificatesServiceError(
      parsed.success ? parsed.data.message : "Não foi possível concluir a solicitação de certificados. Tente novamente.",
      response.status,
    );
  }
  return response;
}

async function readJson<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new CertificatesServiceError("O serviço retornou dados de certificados inválidos.");
  return parsed.data;
}

export async function getCertificates(signal?: AbortSignal): Promise<CertificateRecord[]> {
  const response = await requestCertificates("/api/submissions", { signal, cache: "no-store" });
  return (await readJson(response, certificateListSchema)).items;
}

export async function createCertificate(fields: CertificateFields, file: File): Promise<CertificateRecord> {
  const values = certificateFieldsSchema.parse(fields);
  const validatedFile = certificateBlobSchema.safeParse(file);
  if (!validatedFile.success) throw new CertificatesServiceError("Selecione um PDF, JPG ou PNG válido com até 5 MB.");
  const body = new FormData();
  body.set("title", values.title);
  body.set("category", values.category);
  body.set("hours", String(values.hours));
  body.set("description", values.description);
  body.set("document", file);
  const response = await requestCertificates("/api/submissions", { method: "POST", body });
  return readJson(response, certificateRecordSchema);
}

export async function downloadCertificateDocument(certificate: CertificateRecord): Promise<void> {
  const validatedCertificate = certificateRecordSchema.parse(certificate);
  const response = await requestCertificates(`/api/submissions/${encodeURIComponent(validatedCertificate.id)}/document`, { cache: "no-store" });
  const parsed = certificateBlobSchema.safeParse(await response.blob());
  if (!parsed.success) throw new CertificatesServiceError("O comprovante recebido é inválido. Tente novamente.");
  const url = URL.createObjectURL(parsed.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = validatedCertificate.document.name;
  document.body.append(link);
  link.click();
  link.remove();
  // Keep the URL alive long enough for the browser to begin downloading.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
