import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-primary rounded-xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        outline: "btn-secondary rounded-xl",
        secondary: "btn-secondary rounded-xl",
        ghost: "btn-ghost rounded-xl",
        link: "text-primary underline-offset-4 hover:underline rounded-xl",
        accent: "btn-accent rounded-xl",
        success: "btn-success rounded-xl",
        premium: "btn-primary rounded-full px-8 py-3 text-base font-semibold tracking-wide shadow-lg hover:shadow-xl transform hover:scale-105",
        hero: "btn-accent rounded-full px-12 py-4 text-lg font-bold tracking-wide shadow-2xl hover:shadow-3xl transform hover:scale-110",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        icon: "h-11 w-11",
        xl: "h-16 px-12 py-5 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
