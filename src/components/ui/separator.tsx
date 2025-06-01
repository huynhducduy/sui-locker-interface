import * as React from "react"

import { cn } from "@/utils/ui"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

const Separator = ({ ref, className, orientation = "horizontal", ...props }: SeparatorProps & { ref?: React.RefObject<HTMLDivElement | null> }) => (
    <div
      ref={ref}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
Separator.displayName = "Separator"

export { Separator }
