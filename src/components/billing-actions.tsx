'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Plan } from '@/server/services/billing.service'

type UpgradeButtonProps = {
  plan: Exclude<Plan, 'free'>
  label: string
  currentPlan: Plan
}

export function UpgradeButton({ plan, label, currentPlan }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const isCurrentPlan = plan === currentPlan

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant={isCurrentPlan ? 'outline' : 'default'}
      disabled={isCurrentPlan || loading}
      onClick={handleClick}
      className="h-7 text-xs px-3 cursor-pointer"
    >
      {loading ? 'Redirecting…' : isCurrentPlan ? 'Current' : 'Upgrade'}
    </Button>
  )
}

type ManageBillingButtonProps = {
  hasSubscription: boolean
}

export function ManageBillingButton({ hasSubscription }: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false)

  if (!hasSubscription) return null

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="h-7 text-xs px-3 cursor-pointer"
    >
      {loading ? 'Redirecting…' : 'Manage Billing'}
    </Button>
  )
}
