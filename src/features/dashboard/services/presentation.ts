import { dashboardPresentationSchema, type DashboardPresentation } from "@/features/dashboard/schemas/presentation-schema";

export async function getDashboardPresentation(signal: AbortSignal): Promise<DashboardPresentation> {
  let response: Response;
  try {
    response = await fetch("/api/demo/dashboard", { signal, cache: "no-store" });
  } catch (error: unknown) {
    if (signal.aborted) throw error;
    throw new Error("Não foi possível conectar à demonstração. Tente novamente.");
  }
  if (!response.ok) throw new Error("Não foi possível carregar a demonstração. Tente novamente.");
  const body: unknown = await response.json().catch(() => null);
  const result = dashboardPresentationSchema.safeParse(body);
  if (!result.success) throw new Error("A demonstração retornou dados inválidos. Tente novamente.");
  return result.data;
}
