import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// без этого tailwind-merge примет text-m за цвет текста и выкинет его при слиянии с text-white
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['title-2xl', 'm', 'caption-s', 'caption-xs', 'headline-l'] }],
      rounded: [{ rounded: ['xs', 'm', 'tab', 'xl'] }],
    },
  },
})

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
