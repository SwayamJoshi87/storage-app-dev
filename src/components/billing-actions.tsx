'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import type { Plan } from '@/server/services/billing.service'

type UpgradeButtonProps = {
  plan: Exclude<Plan, 'free'>
  label: string
  currentPlan: Plan
}

export function UpgradeButton({ plan, label, currentPlan }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)

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

  const isCurrentPlan = plan === currentPlan

  return (
    <Button
      size="small"
      variant={isCurrentPlan ? 'outlined' : 'contained'}
      disabled={isCurrentPlan || loading}
      onClick={handleClick}
      disableElevation
      sx={isCurrentPlan
        ? { borderColor: 'rgba(96,165,250,0.3)', color: '#60a5fa', fontSize: '0.75rem', py: 0.25, px: 1.5 }
        : { fontSize: '0.75rem', py: 0.25, px: 1.5 }
      }
    >
      {loading ? 'Redirecting…' : isCurrentPlan ? 'Current' : `Upgrade`}
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
      variant="outlined"
      size="small"
      onClick={handleClick}
      disabled={loading}
      sx={{ borderColor: '#3f3f46', color: '#d4d4d8', '&:hover': { borderColor: '#71717a' }, fontSize: '0.75rem', py: 0.25, px: 1.5 }}
    >
      {loading ? 'Redirecting…' : 'Manage Billing'}
    </Button>
  )
}
