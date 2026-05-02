"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

interface SectionNavProps {
  currentPage: "camera" | "editor" | "gallery";
}

const items: Array<{
  href: "/camera" | "/editor" | "/gallery";
  key: "camera" | "editor" | "gallery";
  label: string;
}> = [
  { href: "/camera", key: "camera", label: "Camera" },
  { href: "/editor", key: "editor", label: "Editing" },
  { href: "/gallery", key: "gallery", label: "Session Gallery" },
];

export function SectionNav({ currentPage }: SectionNavProps) {
  return (
    <nav className="grid gap-2 sm:grid-cols-3" aria-label="Photobooth sections">
      {items.map((item) => {
        const active = item.key === currentPage;
        return (
          <Link
            key={item.key}
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
