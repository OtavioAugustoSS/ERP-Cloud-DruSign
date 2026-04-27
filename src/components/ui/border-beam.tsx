"use client"

import { cn } from "@/lib/utils"

interface BorderBeamProps {
  size?: number
  duration?: number
  colorFrom?: string
  colorTo?: string
  borderWidth?: number
  className?: string
  delay?: number
}

export const BorderBeam = ({
  className,
  size = 200,
  duration = 8,
  colorFrom = "#22d3ee",
  colorTo = "#3b82f6",
  borderWidth = 2,
  delay = 0,
}: BorderBeamProps) => {
  return (
    <div 
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden", className)}
      style={{
        padding: borderWidth,
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
      }}
    >
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square animate-[spin_8s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg, transparent 75%, ${colorFrom} 85%, ${colorTo} 100%)`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`
        }}
      />
    </div>
  )
}
