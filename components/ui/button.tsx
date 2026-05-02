import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[1rem] border bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[#f4dcb6] bg-[linear-gradient(180deg,#8f5030,#6d3821)] text-[#fff1d3] shadow-[0_4px_0_0_rgba(92,46,25,0.95),0_10px_20px_rgba(90,48,26,0.18)] hover:brightness-110",
        outline:
          "border-[#c49b68] bg-[#fff8ed] text-[#71452a] shadow-[0_3px_0_0_rgba(196,155,104,0.85)] hover:bg-[#f6e1be] aria-expanded:bg-[#f6e1be]",
        secondary:
          "border-[#d2b387] bg-[#eed4a6] text-[#6b4027] shadow-[0_3px_0_0_rgba(184,145,88,0.8)] hover:bg-[#e7c88e]",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-[#f3dfbc] aria-expanded:bg-[#f3dfbc]",
        destructive:
          "border-[#f0b39f] bg-[#fff0ea] text-[#a23d1d] shadow-[0_3px_0_0_rgba(212,118,85,0.45)] hover:bg-[#ffe4d9] focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 uppercase tracking-[0.12em] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-7 gap-1 rounded-[0.9rem] px-2 text-[0.65rem] uppercase tracking-[0.12em] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[0.95rem] px-3 text-[0.72rem] uppercase tracking-[0.12em] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-4 uppercase tracking-[0.14em] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[0.9rem] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[0.95rem] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
