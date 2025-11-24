import { cn } from "@/lib/utils";
import * as React from "react";

type BadgeVariant = "default" | "secondary";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-indigo-100 text-indigo-800",
    secondary: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
