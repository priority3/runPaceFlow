import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'focus-visible:ring-blue inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-blue text-white shadow-sm hover:bg-blue/90',
        destructive: 'bg-red text-white shadow-sm hover:bg-red/90',
        outline:
          'premium-surface bg-tertiary-system-background text-label hover:bg-secondary-system-background',
        secondary: 'bg-secondary-system-fill text-label shadow-sm hover:bg-system-fill',
        ghost: 'text-label hover:bg-system-fill',
        link: 'text-link underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-9 rounded-md px-4 text-xs',
        lg: 'h-12 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
