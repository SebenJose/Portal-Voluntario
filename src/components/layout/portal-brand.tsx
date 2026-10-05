import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type PortalBrandProps = {
  className?: string;
  inverse?: boolean;
  size?: "default" | "large";
};

export function PortalBrand({
  className,
  inverse = false,
  size = "default",
}: PortalBrandProps) {
  return (
    <Link
      aria-label="Portal Voluntário da UTFPR — página inicial"
      className={cn("inline-flex shrink-0 items-center", className)}
      href="/"
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden",
          inverse ? "bg-transparent" : "bg-white",
          size === "large"
            ? "h-12 w-32 sm:h-14 sm:w-36"
            : "h-10 w-28 sm:h-12 sm:w-32",
        )}
      >
        <Image
          alt=""
          className={cn(
            "h-auto w-full",
            inverse &&
              "[filter:drop-shadow(1px_0_0_#facc15)_drop-shadow(-1px_0_0_#facc15)_drop-shadow(0_1px_0_#facc15)_drop-shadow(0_-1px_0_#facc15)]",
          )}
          height={143}
          priority
          src="/brand/utfpr-logo-horizontal.png"
          width={367}
        />
      </span>
    </Link>
  );
}
