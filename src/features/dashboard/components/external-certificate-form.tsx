"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileCheck2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { certificateHoursDraftSchema } from "@/features/certificates/schemas/certificate-schema";
import { activityCategories } from "@/lib/activity-categories";

import {
  ExternalSubmissionError,
  submitExternalCertificate,
  type ExternalSubmissionReceipt,
} from "../services/external-submissions";
import {
  externalSubmissionSchema,
  type ExternalSubmissionFormInput,
  type ExternalSubmissionFormValues,
} from "../schemas/external-submission-schema";

const fieldClassName =
  "w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function ExternalCertificateForm() {
  const [receipt, setReceipt] = useState<ExternalSubmissionReceipt | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const form = useForm<ExternalSubmissionFormInput, unknown, ExternalSubmissionFormValues>({
    resolver: zodResolver(externalSubmissionSchema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      category: "Extensão",
      hours: "1",
      description: "",
    },
  });

  const handleSubmit: SubmitHandler<ExternalSubmissionFormValues> = async (values) => {
    setRequestError(null);

    try {
      const submittedReceipt = await submitExternalCertificate(values);
      setReceipt(submittedReceipt);
      form.reset({ title: "", category: "Extensão", hours: "1", description: "" });
    } catch (error: unknown) {
      setRequestError(
        error instanceof ExternalSubmissionError
          ? error.message
          : "Ocorreu um erro inesperado. Tente novamente.",
      );
    }
  };

  if (receipt) {
    return (
      <Card className="mt-5 border-brand-yellow/40 bg-brand-yellow/10" id="certificados">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2 text-brand-black">
              <FileCheck2 aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-brand-black" role="status">
                Certificado registrado
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                “{receipt.title}” foi salvo. Consulte os dados e o comprovante na página de certificados.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Protocolo {receipt.id}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Button nativeButton={false} render={<Link href="/certificados" />}>Ver meus certificados</Button>
            <Button onClick={() => setReceipt(null)} variant="outline">Registrar outro certificado</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-5 border-brand-yellow/50" id="certificados">
      <CardHeader>
        <CardTitle>Submeter certificado externo</CardTitle>
        <CardDescription>
          Registre uma atividade realizada fora do portal. Nesta demonstração, o arquivo fica neste navegador e a análise é simulada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form aria-busy={form.formState.isSubmitting} className="grid gap-5 md:grid-cols-2" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <fieldset className="contents" disabled={form.formState.isSubmitting}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="submission-title">Título da atividade</Label>
            <Input
              aria-describedby={form.formState.errors.title ? "submission-title-error" : undefined}
              aria-invalid={Boolean(form.formState.errors.title)}
              id="submission-title"
              placeholder="Ex.: Semana de iniciação científica"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-sm text-destructive" id="submission-title-error">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="submission-category">Eixo temático</Label>
            <select
              aria-describedby={form.formState.errors.category ? "submission-category-error" : undefined}
              aria-invalid={Boolean(form.formState.errors.category)}
              className={fieldClassName}
              id="submission-category"
              {...form.register("category")}
            >
              {activityCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            {form.formState.errors.category ? (
              <p className="text-sm text-destructive" id="submission-category-error">
                {form.formState.errors.category.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="submission-hours">Horas declaradas</Label>
            <Controller
              control={form.control}
              name="hours"
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  aria-describedby={fieldState.error ? "submission-hours-help submission-hours-error" : "submission-hours-help"}
                  aria-invalid={Boolean(fieldState.error)}
                  id="submission-hours"
                  inputMode="numeric"
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    if (certificateHoursDraftSchema.safeParse(value).success) field.onChange(value);
                  }}
                  type="text"
                />
              )}
            />
            <p className="text-xs text-muted-foreground" id="submission-hours-help">Use apenas números inteiros, de 1 a 200.</p>
            {form.formState.errors.hours ? (
              <p className="text-sm text-destructive" id="submission-hours-error">
                {form.formState.errors.hours.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="submission-description">Descrição</Label>
            <textarea
              aria-describedby={form.formState.errors.description ? "submission-description-error" : undefined}
              aria-invalid={Boolean(form.formState.errors.description)}
              className={`${fieldClassName} min-h-24 resize-y`}
              id="submission-description"
              placeholder="Conte quando e onde a atividade aconteceu."
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-sm text-destructive" id="submission-description-error">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="submission-document">Comprovante</Label>
            <Input
              accept="application/pdf,image/jpeg,image/png"
              aria-describedby={form.formState.errors.document ? "submission-document-help submission-document-error" : "submission-document-help"}
              aria-invalid={Boolean(form.formState.errors.document)}
              id="submission-document"
              type="file"
              {...form.register("document")}
            />
            <p className="text-xs text-muted-foreground" id="submission-document-help">
              PDF, JPG ou PNG · até 5 MB
            </p>
            {form.formState.errors.document ? (
              <p className="text-sm text-destructive" id="submission-document-error">
                {form.formState.errors.document.message}
              </p>
            ) : null}
          </div>

          {requestError ? (
            <p className="text-sm text-destructive md:col-span-2" role="alert">
              {requestError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 md:col-span-2 md:flex-row md:justify-end">
            <Button
              disabled={form.formState.isSubmitting}
              type="submit"
              className="bg-brand-yellow font-semibold text-brand-black hover:bg-brand-yellow/85"
            >
              <Upload aria-hidden="true" />
              {form.formState.isSubmitting ? "Registrando..." : "Registrar certificado"}
            </Button>
          </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
