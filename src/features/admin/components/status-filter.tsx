import { Button } from "@/components/ui/button";

/** Grupo de botões de filtro com estado anunciado por aria-pressed. */
export function StatusFilter<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div aria-label={label} className="flex flex-wrap gap-2" role="group">
      {options.map((option) => (
        <Button
          aria-pressed={value === option.value}
          className={value === option.value ? "bg-brand-yellow text-brand-black hover:bg-brand-yellow/85" : "border-brand-black/20"}
          key={option.value}
          onClick={() => onChange(option.value)}
          size="sm"
          variant={value === option.value ? "default" : "outline"}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
