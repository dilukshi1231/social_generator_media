"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        className={cn(
            "relative flex w-full touch-none select-none items-center group",
            className
        )}
        {...props}
    >
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-gradient-to-r from-slate-200 to-slate-300 shadow-inner">
            <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-sm transition-all duration-300" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-3 border-white bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg ring-0 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:shadow-xl cursor-grab active:cursor-grabbing active:scale-95" />
    </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
