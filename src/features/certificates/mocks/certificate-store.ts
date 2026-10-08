import { z } from "zod";

import {
  certificateBlobSchema,
  certificateFieldsSchema,
  certificateRecordSchema,
  type CertificateFields,
  type CertificateRecord,
} from "@/features/certificates/schemas/certificate-schema";

const databaseName = "portal-voluntario-certificates";
const storeName = "certificates";
const storedCertificateSchema = certificateRecordSchema.extend({
  ownerId: z.string().min(1),
  file: certificateBlobSchema,
});

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("O armazenamento de certificados não está disponível neste navegador."));
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir os certificados."));
    request.onblocked = () => reject(new Error("Feche outras abas do portal e tente novamente."));
  });
}

function readStore(database: IDBDatabase, id?: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = id ? store.get(id) : store.getAll();
    request.onsuccess = () => {
      const result: unknown = request.result;
      resolve(result);
    };
    request.onerror = () => reject(request.error ?? new Error("Não foi possível ler os certificados."));
    transaction.onabort = () => reject(transaction.error ?? new Error("A leitura foi interrompida."));
  });
}

export async function storeCertificate(
  ownerId: string,
  fields: CertificateFields,
  file: File,
): Promise<CertificateRecord> {
  const values = certificateFieldsSchema.parse(fields);
  const certificate = storedCertificateSchema.parse({
    ...values,
    id: crypto.randomUUID(),
    ownerId,
    createdAt: new Date().toISOString(),
    status: "Em análise",
    document: { name: file.name, type: file.type, size: file.size },
    file,
  });
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível salvar o certificado."));
      transaction.onabort = () => reject(transaction.error ?? new Error("O envio foi interrompido."));
      transaction.objectStore(storeName).add(certificate);
    });
  } finally {
    database.close();
  }
  return certificateRecordSchema.parse(certificate);
}

export async function listStoredCertificates(ownerId: string): Promise<CertificateRecord[]> {
  const database = await openDatabase();
  try {
    const records = z.array(storedCertificateSchema).parse(await readStore(database));
    return records
      .filter((record) => record.ownerId === ownerId)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
      .map((record) => certificateRecordSchema.parse(record));
  } finally {
    database.close();
  }
}

export async function getStoredDocument(ownerId: string, id: string): Promise<Blob | null> {
  const database = await openDatabase();
  try {
    const input = await readStore(database, id);
    if (input === undefined) return null;
    const record = storedCertificateSchema.parse(input);
    return record.ownerId === ownerId ? record.file : null;
  } finally {
    database.close();
  }
}
