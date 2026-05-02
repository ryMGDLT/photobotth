import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[#f1dbb7] bg-[linear-gradient(180deg,#8d4f30,#6e3922)] text-[#fff1d3] shadow-[0_4px_12px_rgba(86,42,22,0.18)]",
        secondary:
          "border-[#d2b387] bg-[#eed4a6] text-[#6b4027]",
        outline: "border-[#c59a66] bg-[#fff8ed] text-[#71452a]",
        accent: "border-[#e7d3b0] bg-[#5f7d60] text-[#fff2da]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
