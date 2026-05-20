import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Snowflake, ShieldCheck, DollarSign, Archive, Check } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

const PLANS = [
  { label: 'Free',     price: '$0',      cold: '25 GB',  hot: '—',       retrievals: 1,  popular: false },
  { label: 'Starter',  price: '$4/mo',   cold: '500 GB', hot: '—',       retrievals: 3,  popular: false },
  { label: 'Personal', price: '$10/mo',  cold: '2 TB',   hot: '50 GB',   retrievals: 5,  popular: true  },
  { label: 'Creator',  price: '$30/mo',  cold: '10 TB',  hot: '200 GB',  retrievals: 15, popular: false },
  { label: 'Power',    price: '$100/mo', cold: '50 TB',  hot: '500 GB',  retrievals: 40, popular: false },
]

const FEATURES = [
  { icon: Archive,     title: 'Glacier Deep Archive',   description: 'Files land in AWS S3 Glacier Deep Archive — the cheapest durable storage on the planet. 99.999999999% durability.' },
  { icon: DollarSign,  title: 'Fixed Monthly Pricing',  description: 'One flat fee per month. No per-GB egress charges, no surprise bills. Know exactly what you pay.' },
  { icon: ShieldCheck, title: 'Simple Retrieval',       description: 'Request a restore and get notified when your files are ready to download. Bulk restores in 12–48 hours.' },
]

export default async function LandingPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>

      {/* Navbar */}
      <Box
        component="nav"
        sx={{ borderBottom: '1px solid rgba(39,39,42,0.6)', px: 3, py: 1.5 }}
      >
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box component="a" href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'text.primary' }}>
            <Snowflake size={18} color="#60a5fa" />
            <Typography variant="body1" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Archivault</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button href="/sign-in" variant="text" size="small" sx={{ color: 'text.secondary' }}>
              Sign In
            </Button>
            <Button href="/sign-up" variant="contained" size="small" disableElevation>
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero */}
      <Box component="section" sx={{ py: 14, textAlign: 'center', px: 3 }}>
        <Container maxWidth="md">
          <Chip
            icon={<Snowflake size={12} color="#60a5fa" />}
            label="Powered by AWS S3 Glacier Deep Archive"
            size="small"
            sx={{ mb: 3, bgcolor: 'rgba(96,165,250,0.05)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', fontSize: '0.7rem' }}
          />
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#fafafa' }}>
            Cheap cold storage<br />for massive files.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4, maxWidth: 480, mx: 'auto' }}>
            No AWS bill anxiety. Fixed monthly pricing. Archive terabytes of data without watching a cost dashboard.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button href="/sign-up" variant="contained" size="large" disableElevation>
              Start for free
            </Button>
            <Button href="#pricing" variant="outlined" size="large"
              sx={{ borderColor: '#3f3f46', color: '#d4d4d8', '&:hover': { borderColor: '#71717a' } }}>
              See pricing
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Box component="section" sx={{ py: 8, px: 3 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Grid key={title} size={{ xs: 12, md: 4 }}>
                <Card elevation={0} sx={{ height: '100%', bgcolor: 'background.paper' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'inline-flex', p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(96,165,250,0.1)', color: '#60a5fa', mb: 2 }}>
                      <Icon size={20} />
                    </Box>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing */}
      <Box component="section" id="pricing" sx={{ py: 8, px: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#fafafa' }}>
              Simple pricing
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Pay once a month. No per-GB surprises.
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {PLANS.map(plan => (
              <Grid key={plan.label} size={{ xs: 12, sm: 6, lg: 'grow' }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    ...(plan.popular && { border: '1px solid rgba(96,165,250,0.4)', bgcolor: 'rgba(96,165,250,0.03)' }),
                  }}
                >
                  <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {plan.popular && (
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                        Most popular
                      </Typography>
                    )}
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{plan.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, mb: 2.5, fontVariantNumeric: 'tabular-nums' }}>
                      {plan.price}
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {[
                        `${plan.cold} cold storage`,
                        `${plan.hot} hot storage`,
                        `${plan.retrievals} retrieval${plan.retrievals !== 1 ? 's' : ''}/mo`,
                      ].map(item => (
                        <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Check size={12} color="#34d399" />
                          <Typography variant="caption" color="text.secondary">{item}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      href="/sign-up"
                      fullWidth
                      variant={plan.popular ? 'contained' : 'outlined'}
                      size="small"
                      disableElevation
                      sx={{
                        mt: 2.5,
                        ...(!plan.popular && { borderColor: '#3f3f46', color: '#d4d4d8', '&:hover': { borderColor: '#71717a' } }),
                      }}
                    >
                      Get started
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Divider sx={{ borderColor: 'rgba(39,39,42,0.5)' }} />

      {/* Footer */}
      <Box component="footer" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Snowflake size={12} color="rgba(96,165,250,0.4)" />
          <Typography variant="caption" sx={{ color: '#3f3f46' }}>
            Archivault — Cold Storage for Massive Files
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
