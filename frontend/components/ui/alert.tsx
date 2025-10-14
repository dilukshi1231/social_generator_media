import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800",
        className
      )}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm", className)} {...props} />;
}
