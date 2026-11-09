import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-terracotta text-white shadow-sm hover:bg-terracotta-hover",
        forest: "bg-forest text-white shadow-sm hover:bg-forest-light",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline: "border border-charcoal-border bg-white text-charcoal hover:bg-ivory-soft hover:border-charcoal-muted shadow-xs",
        secondary: "bg-ivory-soft text-forest hover:bg-ivory-dark shadow-xs",
        ghost: "hover:bg-ivory-soft text-charcoal hover:text-forest",
        link: "text-terracotta underline-offset-4 hover:underline",
        sage: "bg-sage-surface text-forest border border-sage hover:bg-sage-light shadow-xs",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
