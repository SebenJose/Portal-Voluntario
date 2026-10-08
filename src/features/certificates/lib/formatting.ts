const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});
const sizeFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function formatCertificateDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatCertificateSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${sizeFormatter.format(bytes / (1024 * 1024))} MB`
    : `${sizeFormatter.format(bytes / 1024)} KB`;
}
