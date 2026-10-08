import { certificateFieldsSchema, type CertificateRecord } from "@/features/certificates/schemas/certificate-schema";
import { CertificatesServiceError, createCertificate } from "@/features/certificates/services/certificates";
import { externalSubmissionSchema, type ExternalSubmissionFormValues } from "@/features/dashboard/schemas/external-submission-schema";

export { CertificatesServiceError as ExternalSubmissionError } from "@/features/certificates/services/certificates";
export type ExternalSubmissionReceipt = CertificateRecord;

export async function submitExternalCertificate(
  values: ExternalSubmissionFormValues,
): Promise<ExternalSubmissionReceipt> {
  const validatedValues = certificateFieldsSchema.safeParse(values);
  const validatedDocument = externalSubmissionSchema.shape.document.safeParse(values.document);
  if (!validatedValues.success || !validatedDocument.success) {
    throw new CertificatesServiceError("Confira os dados e selecione o comprovante novamente.");
  }
  const file = validatedDocument.data.item(0);

  if (!file) {
    throw new CertificatesServiceError("Selecione o certificado novamente e tente enviar.");
  }

  return createCertificate(validatedValues.data, file);
}
