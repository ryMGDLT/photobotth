"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full rounded-full border-[#c59a66] bg-[#fff7ea] text-[#71452a] dark:border-[#7f5b3f] dark:bg-[#2f1b14] dark:text-[#f5d8b3] sm:w-auto"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {isDark ? "Light Mode" : "Dark Mode"}
    </Button>
  );
}
