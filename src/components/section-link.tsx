"use client";

import type { ComponentProps, MouseEvent } from "react";
import Link from "next/link";

type SectionLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  sectionId: string;
};

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function SectionLink({ sectionId, onClick, ...props }: SectionLinkProps) {
  const hash = `#${sectionId}`;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || !isPlainLeftClick(event) || window.location.hash !== hash) return;

    // O Next só rola quando o hash muda; repetir o clique com o mesmo hash não faria nada.
    const section = document.getElementById(sectionId);
    if (!section) return;

    event.preventDefault();
    section.scrollIntoView();
  }

  return <Link {...props} href={hash} onClick={handleClick} />;
}
