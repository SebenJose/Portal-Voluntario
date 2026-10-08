import { delay, http, HttpResponse, type RequestHandler } from "msw";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/services/client-auth";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { certificateBlobSchema, certificateFieldsSchema } from "@/features/certificates/schemas/certificate-schema";
import { getStoredDocument, listStoredCertificates, storeCertificate } from "@/features/certificates/mocks/certificate-store";

async function requireMockUser(): Promise<AuthUser | Response> {
  try {
    const user = await getCurrentUser();
    return user ?? HttpResponse.json({ message: "Entre na sua conta para acessar os certificados." }, { status: 401 });
  } catch {
    return HttpResponse.json({ message: "Não foi possível verificar sua sessão. Tente novamente." }, { status: 503 });
  }
}

function storageError(error: unknown): Response {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return HttpResponse.json({ message: "O armazenamento deste navegador está cheio. Libere espaço e tente novamente." }, { status: 507 });
  }
  return HttpResponse.json({ message: "Não foi possível acessar os certificados salvos neste navegador. Tente novamente." }, { status: 500 });
}

export const certificateHandlers: RequestHandler[] = [
  http.get("/api/submissions", async ({ request }) => {
    const user = await requireMockUser();
    if (user instanceof Response) return user;
    const scenario = new URL(request.url).searchParams.get("scenario");
    if (scenario === "server-error") return HttpResponse.json({ message: "Não foi possível consultar os certificados." }, { status: 500 });
    if (scenario === "network-error") return HttpResponse.error();
    if (scenario === "empty") return HttpResponse.json({ items: [] });
    await delay(scenario === "loading" ? 1500 : 150);
    try {
      return HttpResponse.json({ items: await listStoredCertificates(user.id) }, { headers: { "Cache-Control": "no-store" } });
    } catch (error: unknown) {
      return storageError(error);
    }
  }),
  http.post("/api/submissions", async ({ request }) => {
    const user = await requireMockUser();
    if (user instanceof Response) return user;
    const data = await request.formData().catch(() => null);
    if (!data) return HttpResponse.json({ message: "Envie o certificado e os dados da atividade." }, { status: 400 });
    const fields = certificateFieldsSchema.safeParse({
      title: data.get("title"),
      category: data.get("category"),
      hours: Number(data.get("hours")),
      description: data.get("description"),
    });
    const file = data.get("document");
    if (!fields.success || !(file instanceof File) || !certificateBlobSchema.safeParse(file).success) {
      return HttpResponse.json({ message: "Confira os dados e anexe um PDF, JPG ou PNG com até 5 MB." }, { status: 400 });
    }
    await delay(200);
    try {
      return HttpResponse.json(await storeCertificate(user.id, fields.data, file), { status: 201 });
    } catch (error: unknown) {
      return storageError(error);
    }
  }),
  http.get("/api/submissions/:id/document", async ({ params }) => {
    const user = await requireMockUser();
    if (user instanceof Response) return user;
    const id = z.uuid().safeParse(params.id);
    if (!id.success) return HttpResponse.json({ message: "Certificado não encontrado." }, { status: 404 });
    try {
      const file = await getStoredDocument(user.id, id.data);
      if (!file) return HttpResponse.json({ message: "Certificado não encontrado." }, { status: 404 });
      return new HttpResponse(file, { headers: { "Content-Type": file.type, "Cache-Control": "no-store" } });
    } catch (error: unknown) {
      return storageError(error);
    }
  }),
];
