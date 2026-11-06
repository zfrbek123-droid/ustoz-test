'use client'

// Daraja ikonkasini nom bo'yicha chizish (statik komponent qoidasiga mos)
import { createElement } from 'react'
import { LEVEL_ICONS, Sprout } from '@/lib/visual'

export function DynIcon({ name, className }: { name: string; className?: string }) {
  return createElement(LEVEL_ICONS[name] ?? Sprout, { className, 'aria-hidden': true })
}
