import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-[calc(var(--radius)*1.1)] bg-gradient-to-r from-white/40 via-white/75 to-white/40 bg-[length:200%_100%] [animation:shimmer_1.6s_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
