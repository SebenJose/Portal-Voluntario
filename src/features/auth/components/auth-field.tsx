"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
  icon: LucideIcon;
};

export function AuthField({ id, label, error, icon: Icon, type, className, ...props }: AuthFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-medium" htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          {...props}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          className={cn("h-13 rounded-xl bg-muted/40 pl-11", isPassword ? "pr-14" : "pr-4", className)}
          id={id}
          type={isPassword && passwordVisible ? "text" : type}
        />
        {isPassword ? (
          <Button
            aria-controls={id}
            aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
            className="absolute top-1/2 right-1 size-11 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-brand-black"
            disabled={props.disabled}
            onClick={() => setPasswordVisible((visible) => !visible)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {passwordVisible ? <EyeOff aria-hidden="true" className="size-4.5" /> : <Eye aria-hidden="true" className="size-4.5" />}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive" id={`${id}-error`}>{error}</p> : null}
    </div>
  );
}
