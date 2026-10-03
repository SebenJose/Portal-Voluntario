import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type PortalBrandProps = {
  className?: string;
  inverse?: boolean;
  stacked?: boolean;
  hideNameOnMobile?: boolean;
  size?: "default" | "large";
};

export function PortalBrand({
  className,
  inverse = false,
  stacked = false,
  hideNameOnMobile = false,
  size = "default",
}: PortalBrandProps) {
  return (
    <Link
      aria-label="Portal Voluntário da UTFPR — página inicial"
      className={cn(
        "flex shrink-0 items-center gap-3 font-semibold tracking-tight",
        stacked && "flex-col items-start gap-1",
        inverse && "text-white",
        className,
      )}
      href="/"
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden",
          inverse ? "bg-transparent" : "bg-white",
          !stacked && "-translate-y-1",
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
      <span
        className={cn(
          "border-l-2 border-yellow-400 pl-3 leading-tight",
          size === "large" ? "text-lg font-bold sm:text-xl lg:text-2xl" : "text-sm",
          stacked && "border-l-0 pl-0",
          hideNameOnMobile && "hidden sm:block",
        )}
      >
        Portal Voluntário
      </span>
    </Link>
  );
}
