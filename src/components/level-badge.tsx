'use client'

import { levelColor } from '@/lib/visual'
import { DynIcon } from '@/components/dyn-icon'
import { cn } from '@/lib/utils'

export function LevelBadge({
  order,
  name,
  icon,
  size = 'md',
}: {
  order: number
  name: string
  icon: string
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        levelColor(order),
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        size === 'lg' && 'px-4 py-1.5 text-base'
      )}
    >
      <DynIcon name={icon} className={cn(size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />
      <span>
        {order}-daraja · {name}
      </span>
    </span>
  )
}
