export function getSafeRedirectPath(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/painel";
  if (value.includes("\\") || /[\u0000-\u001f]/u.test(value)) return "/painel";
  try {
    const parsed = new URL(value, "https://portal-voluntario.local");
    if (parsed.origin !== "https://portal-voluntario.local") return "/painel";
    if (/^\/(entrar|criar-conta)(\/|$)/u.test(parsed.pathname)) return "/painel";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/painel";
  }
}
