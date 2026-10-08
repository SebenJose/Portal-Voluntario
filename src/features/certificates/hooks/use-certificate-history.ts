"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { CertificateRecord } from "@/features/certificates/schemas/certificate-schema";
import { CertificatesServiceError, downloadCertificateDocument, getCertificates } from "@/features/certificates/services/certificates";

export function useCertificateHistory(userId: string) {
  const router = useRouter();
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setIsLoading(true);
      setError(null);
      setCertificates([]);
      try {
        const records = await getCertificates(controller.signal);
        if (!controller.signal.aborted) setCertificates(records);
      } catch (requestError: unknown) {
        if (controller.signal.aborted) return;
        if (requestError instanceof CertificatesServiceError && requestError.status === 401) {
          router.replace("/entrar?next=%2Fcertificados");
          return;
        }
        setError(requestError instanceof CertificatesServiceError
          ? requestError.message
          : "Não foi possível carregar seus certificados. Tente novamente.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    });
    return () => controller.abort();
  }, [attempt, router, userId]);

  async function download(certificate: CertificateRecord): Promise<void> {
    if (downloadingId) return;
    setDownloadError(null);
    setDownloadingId(certificate.id);
    try {
      await downloadCertificateDocument(certificate);
    } catch (requestError: unknown) {
      if (requestError instanceof CertificatesServiceError && requestError.status === 401) {
        router.replace("/entrar?next=%2Fcertificados");
        return;
      }
      setDownloadError(requestError instanceof CertificatesServiceError
        ? requestError.message
        : "Não foi possível baixar o comprovante. Tente novamente.");
    } finally {
      setDownloadingId(null);
    }
  }

  return {
    certificates,
    isLoading,
    error,
    downloadingId,
    downloadError,
    download,
    retry: () => setAttempt((currentAttempt) => currentAttempt + 1),
  };
}
