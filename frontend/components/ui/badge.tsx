import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: any) {
  const variants = {
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
