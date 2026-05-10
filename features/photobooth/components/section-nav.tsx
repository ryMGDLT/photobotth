"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Main Menu" },
  { href: "/start", label: "Start" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About Us" },
];

export function SectionNav() {
  const pathname = usePathname();
  
  return (
    <nav className="grid gap-2 sm:grid-cols-4" aria-label="Photobooth sections">
      {items.map((item) => {
        const active = pathname === item.href || (item.href === "/" && pathname === "");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full border px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] transition",
              active
                ? "retro-marquee border-transparent text-[#fff1d3]"
                : "border-[#c59a66] bg-[#fff7ea] text-[#71452a] hover:bg-[#f6e1be]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
