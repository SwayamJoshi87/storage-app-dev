import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { StorageUsageBar } from '@/components/storage-usage-bar'
import { UpgradeButton, ManageBillingButton } from '@/components/billing-actions'
import { userRepo, fileService } from '@/server/container'
import type { Plan } from '@/server/services/billing.service'

const PLANS = [
  { id: 'free',     label: 'Free',     price: '$0',      cold: '25 GB',  hot: '—',       retrievals: 1  },
  { id: 'starter',  label: 'Starter',  price: '$4/mo',   cold: '500 GB', hot: '—',       retrievals: 3  },
  { id: 'personal', label: 'Personal', price: '$10/mo',  cold: '2 TB',   hot: '50 GB',   retrievals: 5  },
  { id: 'creator',  label: 'Creator',  price: '$30/mo',  cold: '10 TB',  hot: '200 GB',  retrievals: 15 },
  { id: 'power',    label: 'Power',    price: '$100/mo', cold: '50 TB',  hot: '500 GB',  retrievals: 40 },
] as const

type PlanRow = typeof PLANS[number]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a' }}>
      {children}
    </Typography>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Box>{value}</Box>
    </Box>
  )
}

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [clerkUser, dbUser, storage] = await Promise.all([
    currentUser(),
    userRepo.findById(userId),
    fileService.getStorageUsage(userId),
  ])

  const currentPlan = (dbUser?.plan ?? 'free') as Plan
  const hasSubscription = !!dbUser?.stripeSubscriptionId

  return (
    <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Account and plan information</Typography>
      </Box>

      {/* Account info */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <SectionLabel>Account</SectionLabel>
        <Paper elevation={0} sx={{ border: '1px solid #27272a', borderRadius: 2, overflow: 'hidden' }}>
          <InfoRow label="Email" value={
            <Typography variant="body2" color="text.primary">
              {clerkUser?.primaryEmailAddress?.emailAddress ?? '—'}
            </Typography>
          } />
          <Divider sx={{ borderColor: '#27272a' }} />
          <InfoRow label="Member since" value={
            <Typography variant="body2" color="text.primary">
              {clerkUser?.createdAt
                ? new Date(clerkUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '—'}
            </Typography>
          } />
          <Divider sx={{ borderColor: '#27272a' }} />
          <InfoRow label="Plan" value={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={currentPlan}
                size="small"
                sx={{ bgcolor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', fontSize: '0.7rem', height: 22, textTransform: 'capitalize' }}
              />
              <ManageBillingButton hasSubscription={hasSubscription} />
            </Box>
          } />
        </Paper>
      </Box>

      {/* Storage usage */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <SectionLabel>Storage Usage</SectionLabel>
        <StorageUsageBar
          plan={currentPlan as 'free' | 'starter' | 'personal' | 'creator' | 'power'}
          coldUsedBytes={storage.coldBytes}
          hotUsedBytes={storage.hotBytes}
        />
      </Box>

      {/* Plans table */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <SectionLabel>Plans</SectionLabel>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #27272a', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Plan</TableCell>
                <TableCell>Cold</TableCell>
                <TableCell>Hot</TableCell>
                <TableCell>Retrievals/mo</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {PLANS.map((plan: PlanRow) => {
                const active = plan.id === currentPlan
                return (
                  <TableRow key={plan.id} sx={active ? { bgcolor: 'rgba(96,165,250,0.04)' } : {}}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {active && <Check size={13} color="#60a5fa" />}
                        <Typography variant="body2" sx={{ fontWeight: active ? 600 : 400, color: active ? '#60a5fa' : undefined }}>
                          {plan.label}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{plan.cold}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{plan.hot}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{plan.retrievals}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{plan.price}</Typography></TableCell>
                    <TableCell align="right">
                      {plan.id !== 'free' && (
                        <UpgradeButton
                          plan={plan.id as Exclude<Plan, 'free'>}
                          label={plan.label}
                          currentPlan={currentPlan}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ borderColor: '#27272a' }} />

      {/* Danger zone */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(248,113,113,0.6)' }}>
          Danger Zone
        </Typography>
        <Paper elevation={0} sx={{ border: '1px solid rgba(153,27,27,0.4)', borderRadius: 2, bgcolor: 'rgba(127,29,29,0.06)', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Delete Account</Typography>
            <Typography variant="caption" color="text.secondary">Permanently delete your account and all data.</Typography>
          </Box>
          <Button variant="contained" color="error" size="small" disabled disableElevation>
            Delete Account
          </Button>
        </Paper>
      </Box>
    </Box>
  )
}
