import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-200",
        className
      )}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-sm font-semibold text-gray-700", className)}
      {...props}
    />
  );
}
