import { z } from "zod";

import { certificateDocumentTypes, certificateFieldsSchema, maximumCertificateSize } from "@/features/certificates/schemas/certificate-schema";

export const externalSubmissionSchema = certificateFieldsSchema.extend({
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
      return file !== null && certificateDocumentTypes.some((type) => type === file.type);
    }, "Envie um arquivo PDF, JPG ou PNG.")
    .refine((files) => {
      if (typeof FileList === "undefined" || !(files instanceof FileList) || files.length !== 1) {
        return false;
      }
      const file = files.item(0);
      return file !== null && file.size > 0 && file.size <= maximumCertificateSize;
    }, "O arquivo deve conter dados e ter no máximo 5 MB."),
});

export type ExternalSubmissionFormValues = z.infer<typeof externalSubmissionSchema>;
