import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-mint text-white shadow-sm hover:bg-mint/90',
        destructive: 'bg-red text-white shadow-sm hover:bg-red/90',
        outline:
          'border border-separator bg-secondary-system-background/50 text-label shadow-sm hover:bg-secondary-system-background/70',
        secondary:
          'bg-secondary-system-fill/60 text-label shadow-sm hover:bg-secondary-system-fill/80',
        ghost: 'text-label hover:bg-secondary-system-fill/60',
        link: 'text-link underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-9 rounded-xl px-4 text-xs',
        lg: 'h-12 rounded-2xl px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
