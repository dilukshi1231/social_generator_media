"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuContent = ({ className, ...props }: any) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-md",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);
export const DropdownMenuLabel = DropdownMenuPrimitive.Label;
export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator;
export const DropdownMenuItem = DropdownMenuPrimitive.Item;
