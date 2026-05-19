import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="mb-4 text-zinc-600">{icon}</div>
      )}
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button render={<Link href={action.href} />} size="sm">
              {action.label}
            </Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
