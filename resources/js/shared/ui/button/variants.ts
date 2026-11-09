import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-m border border-transparent font-semibold transition-colors select-none disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand-strong',
  {
    variants: {
      color: { neutral: '', brand: '' },
      kind: { primary: '', secondary: '', tertiary: '', quaternary: '', quinary: '' },
      size: {
        md: 'h-12 px-4 text-m [&_svg]:size-6',
        sm: 'h-10 px-4 text-caption-s [&_svg]:size-5',
      },
    },
    compoundVariants: [
      {
        color: 'neutral',
        kind: 'primary',
        class:
          'bg-button-neutral-primary-bg-default text-white hover:bg-button-neutral-primary-bg-hover active:bg-button-neutral-primary-bg-active disabled:bg-button-neutral-primary-bg-disable disabled:text-text-on-primary-disabled',
      },
      {
        color: 'neutral',
        kind: 'secondary',
        class:
          'bg-button-neutral-secondary-bg-default text-text-primary hover:bg-button-neutral-secondary-bg-hover active:bg-button-neutral-secondary-bg-active disabled:bg-button-neutral-secondary-bg-disable disabled:text-text-disabled',
      },
      {
        color: 'neutral',
        kind: 'tertiary',
        class:
          'border-button-neutral-tertiary-border-default text-text-primary hover:bg-button-neutral-tertiary-bg-hover active:bg-button-neutral-tertiary-bg-active disabled:border-button-neutral-tertiary-border-disable disabled:text-text-disabled',
      },
      {
        color: 'neutral',
        kind: 'quaternary',
        class:
          'border-button-neutral-quaternary-border-default text-text-primary hover:bg-button-neutral-quaternary-bg-hover active:bg-button-neutral-quaternary-bg-active disabled:text-text-disabled',
      },
      {
        color: 'neutral',
        kind: 'quinary',
        class:
          'bg-button-neutral-quinary-bg-default text-text-primary hover:bg-button-neutral-quinary-bg-hover active:bg-button-neutral-quinary-bg-active disabled:text-text-disabled',
      },
      {
        color: 'brand',
        kind: 'primary',
        class:
          'bg-button-brand-primary-bg-default text-white hover:bg-button-brand-primary-bg-hover active:bg-button-brand-primary-bg-active disabled:bg-button-brand-primary-bg-disable disabled:text-text-on-primary-disabled',
      },
      {
        color: 'brand',
        kind: 'secondary',
        class:
          'bg-button-brand-secondary-bg-default text-button-brand-label hover:bg-button-brand-secondary-bg-hover active:bg-button-brand-secondary-bg-active disabled:bg-button-brand-secondary-bg-disable disabled:text-text-disabled',
      },
      {
        color: 'brand',
        kind: 'tertiary',
        class:
          'border-button-brand-tertiary-border-default text-button-brand-label hover:bg-button-brand-tertiary-bg-hover active:bg-button-brand-tertiary-bg-active disabled:border-button-brand-tertiary-border-disable disabled:text-text-disabled',
      },
    ],
    defaultVariants: { color: 'neutral', kind: 'primary', size: 'md' },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
