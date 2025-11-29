import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-apple text-sm font-semibold ring-offset-background transition-all duration-apple ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] hover:scale-[1.02] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform-gpu cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-apple hover:shadow-apple-lg active:shadow-apple",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-apple hover:shadow-apple-lg active:shadow-apple",
        outline:
          "border border-gray-300 bg-white text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 shadow-apple-sm hover:shadow-apple active:shadow-apple-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-apple-sm hover:shadow-apple active:shadow-apple-sm",
        ghost: "text-primary hover:bg-primary/10 shadow-none hover:shadow-apple-sm active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline shadow-none active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-5 py-2", // 44px - meets touch target minimum
        sm: "h-10 px-4 py-1.5 text-sm", // 40px - acceptable for secondary actions
        lg: "h-12 px-6 py-2.5", // 48px - exceeds minimum
        icon: "h-11 w-11", // 44px - meets touch target minimum
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
