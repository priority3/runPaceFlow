import { cva } from 'class-variance-authority'

/**
 * pr-ui：主按钮是深色实心（accent 已收敛为墨色），彩色只留给状态。
 * 焦点是压深一格的描边，不发光；动效指名属性，不用 transition: all。
 */
export const buttonVariants = cva(
  'focus-visible:outline-label inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-content hover:bg-accent/90',
        destructive: 'border-red/40 text-red hover:bg-red/5',
        outline:
          'premium-surface bg-tertiary-system-background text-label hover:bg-secondary-system-background',
        secondary: 'bg-secondary-system-fill text-label hover:bg-system-fill',
        ghost: 'text-label hover:bg-system-fill',
        link: 'text-accent underline-offset-4 hover:underline',
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
