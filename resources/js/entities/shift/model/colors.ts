export type ShiftColor = 'cornflower' | 'mint' | 'lavanda' | 'brand' | 'info'

// классы только целыми строками: Tailwind ищет их в исходниках как текст, склеенные через `bg-${x}` не найдёт
export const shiftColorClasses: Record<ShiftColor, { chip: string; hours: string; accent: string }> = {
  cornflower: { chip: 'bg-brand-0', hours: 'text-brand-5', accent: 'border-l-brand-2' },
  mint: { chip: 'bg-mint-12', hours: 'text-mint-text', accent: 'border-l-mint-30' },
  lavanda: { chip: 'bg-indigo-20', hours: 'text-lavanda-text', accent: 'border-l-indigo-30' },
  brand: { chip: 'bg-brand-5 text-white', hours: 'text-white', accent: 'border-l-brand-5' },
  info: { chip: 'bg-fills-info-primary', hours: 'text-info', accent: 'border-l-info' },
}
