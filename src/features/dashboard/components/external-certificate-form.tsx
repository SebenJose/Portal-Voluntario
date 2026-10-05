"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileCheck2, Upload } from "lucide-react";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  ExternalSubmissionError,
  submitExternalCertificate,
  type ExternalSubmissionReceipt,
} from "../services/external-submissions";
import {
  externalSubmissionSchema,
  type ExternalSubmissionFormValues,
} from "../schemas/external-submission-schema";

const fieldClassName =
  "w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function ExternalCertificateForm() {
  const [receipt, setReceipt] = useState<ExternalSubmissionReceipt | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const form = useForm<ExternalSubmissionFormValues>({
    resolver: zodResolver(externalSubmissionSchema),
    defaultValues: {
      title: "",
      category: "Extensão",
      hours: 1,
      description: "",
    },
  });

  const handleSubmit: SubmitHandler<ExternalSubmissionFormValues> = async (values) => {
    setRequestError(null);

    try {
      const submittedReceipt = await submitExternalCertificate(values);
      setReceipt(submittedReceipt);
      form.reset({ title: "", category: "Extensão", hours: 1, description: "" });
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
      <Card className="mt-5 border-emerald-700/25 bg-emerald-50">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2 text-emerald-800">
              <FileCheck2 aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-950" role="status">
                Certificado enviado para análise
              </p>
              <p className="mt-1 text-sm text-emerald-900">
                “{receipt.title}” foi recebido. Você poderá acompanhar a homologação no painel.
              </p>
              <p className="mt-1 text-xs text-emerald-800">Protocolo {receipt.id}</p>
            </div>
          </div>
          <Button onClick={() => setReceipt(null)} variant="outline">
            Enviar outro certificado
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-5 border-brand-yellow/50" id="submeter-certificado">
      <CardHeader>
        <CardTitle>Submeter certificado externo</CardTitle>
        <CardDescription>
          Registre uma atividade realizada fora do portal para solicitar a homologação das horas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
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
              <option value="Ensino">Ensino</option>
              <option value="Pesquisa">Pesquisa</option>
              <option value="Extensão">Extensão</option>
            </select>
            {form.formState.errors.category ? (
              <p className="text-sm text-destructive" id="submission-category-error">
                {form.formState.errors.category.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="submission-hours">Horas declaradas</Label>
            <Input
              aria-describedby={form.formState.errors.hours ? "submission-hours-error" : undefined}
              aria-invalid={Boolean(form.formState.errors.hours)}
              id="submission-hours"
              max={200}
              min={1}
              type="number"
              {...form.register("hours", { valueAsNumber: true })}
            />
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
              {form.formState.isSubmitting ? "Enviando..." : "Enviar para homologação"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
